import { format, isValid, parse } from "date-fns";

import {
  COMMON_BRANDS,
  LABEL_ALIASES,
  NOISE_LINE,
  PRODUCT_HINT,
  WARRANTY_WORD,
  detectRetailer,
  type FieldKey,
} from "@/lib/document-extract/aliases";
import { applyRetailerBoosts } from "@/lib/document-extract/retailer-boost";
import {
  emptyExtractedFields,
  setFieldMeta,
  type ExtractedDocumentFields,
  type FieldConfidence,
  type FieldSource,
} from "@/lib/document-extract/types";
import { inferCategory, retailerDisplayName } from "@/lib/document-extract/classify";
import { findGstins, isValidGstin, isValidImei } from "@/lib/document-extract/validate";

/**
 * Indian invoice / warranty-card extraction.
 *
 * Layouts:
 * 1) Label above, value below
 * 2) Label left, value on same line
 *
 * Also applies Amazon / Flipkart / DMart / store-specific boosts.
 */

const WORD_NUMBERS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  eighteen: 18,
  twenty: 20,
  twentyfour: 24,
  "twenty four": 24,
  "twenty-four": 24,
  thirtysix: 36,
  "thirty six": 36,
  "thirty-six": 36,
  fortyeight: 48,
  "forty eight": 48,
  "forty-eight": 48,
};

const PERIOD_AMOUNT =
  "(\\d{1,2}|one|two|three|four|five|six|twelve|eighteen|twenty(?:[\\s-]?four)?|thirty(?:[\\s-]?six)?|forty(?:[\\s-]?eight)?)";

const PERIOD_UNIT = "(years?|yrs?|yr\\b|y\\b|months?|mons?|mos?|mths?|m\\b|महीने|माह|वर्ष|साल)";

function normalizeText(raw: string) {
  return raw
    .replace(/\r/g, "\n")
    .replace(/[|]/g, "I")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function cleanValue(value: string) {
  return value
    .replace(/^[\s:=#\-•*|]+|[\s:=#\-•*|]+$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function stripTrailingMoney(value: string) {
  return value
    .replace(/\s+(?:₹|rs\.?|inr)\.?\s*[\d,]+\.?\d*\s*(?:only)?$/i, "")
    .replace(/\s+[\d,]{1,3}(?:,\d{2,3})+(?:\.\d{1,2})?\s*(?:only)?$/i, "")
    .trim();
}

function getLines(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function matchLabelKey(line: string): FieldKey | null {
  const normalized = cleanValue(line).replace(/[:\-#]+$/g, "").trim();

  for (const [key, patterns] of Object.entries(LABEL_ALIASES) as [
    FieldKey,
    RegExp[],
  ][]) {
    if (patterns.some((pattern) => pattern.test(normalized))) {
      return key;
    }
  }

  return null;
}

function splitLabelValueSameLine(line: string): {
  label: string;
  value: string;
} | null {
  const colonSplit = line.match(/^(.{2,45}?)\s*[:\-#]\s+(.+)$/);
  if (colonSplit?.[1] && colonSplit[2]) {
    return {
      label: cleanValue(colonSplit[1]),
      value: cleanValue(colonSplit[2]),
    };
  }

  const spaced = line.match(/^([A-Za-z][A-Za-z0-9 .\/#]{1,40}?)\s{2,}(.+)$/);
  if (spaced?.[1] && spaced[2]) {
    return {
      label: cleanValue(spaced[1]),
      value: cleanValue(spaced[2]),
    };
  }

  const compactSimple = line.match(
    /^((?:tax\s*)?invoice\s*(?:no|number|#)?|bill\s*(?:no|number|#)?|bill\s*of\s*supply\s*(?:no|number)?|order\s*(?:id|no|number|#)?|order|receipt\s*(?:no|number)?|cash\s*memo\s*(?:no)?|serial\s*(?:no|number)?|sr\.?\s*no|s\/n|imei(?:\s*\/\s*serial(?:\s*no)?)?|brand|manufacturer|make|model(?:\s*name|\s*no)?|product(?:\s*name|\s*title)?|item(?:\s*name|\s*title)?|description|particulars|product\s*title|purchase\s*date|invoice\s*date|order\s*date|date\s*of\s*purchase|bill\s*date|warranty(?:\s*period)?|guarantee(?:\s*period)?|irn)\s+(.+)$/i
  );

  if (compactSimple?.[1] && compactSimple[2]) {
    return {
      label: cleanValue(compactSimple[1]),
      value: cleanValue(compactSimple[2]),
    };
  }

  return null;
}

function buildLayoutPairs(text: string) {
  const lines = getLines(text);
  const pairs: { key: FieldKey; value: string; source: "above" | "inline" }[] =
    [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    const inline = splitLabelValueSameLine(line);
    if (inline) {
      const key = matchLabelKey(inline.label);
      if (key && inline.value) {
        pairs.push({ key, value: inline.value, source: "inline" });
        continue;
      }
    }

    const key = matchLabelKey(line);
    if (key && i + 1 < lines.length) {
      const next = lines[i + 1];
      if (!matchLabelKey(next) && !NOISE_LINE.test(next)) {
        pairs.push({ key, value: cleanValue(next), source: "above" });
      }
    }
  }

  return pairs;
}

function firstLayoutValue(
  pairs: ReturnType<typeof buildLayoutPairs>,
  key: FieldKey
) {
  return pairs.find((pair) => pair.key === key)?.value ?? "";
}

function isPlausibleProductLine(line: string) {
  const trimmed = stripTrailingMoney(line.trim());

  if (trimmed.length < 3 || trimmed.length > 160) return false;
  if (NOISE_LINE.test(trimmed)) return false;
  if (!/[A-Za-z]{2,}/.test(trimmed)) return false;
  if (/^\d+([.,]\d+)?$/.test(trimmed)) return false;
  if (
    /^(invoice|tax invoice|bill of supply|warranty card|receipt|bill|order id)$/i.test(
      trimmed
    )
  ) {
    return false;
  }

  return true;
}

function parseDateCandidate(raw: string) {
  let value = cleanValue(raw);
  // Strip trailing time "24-07-2025, 06:15 PM"
  value = value.replace(/,?\s*\d{1,2}:\d{2}(?:\s*[AP]M)?.*$/i, "").trim();
  value = value.replace(/(\d{1,2})(st|nd|rd|th)\b/gi, "$1");

  const formats = [
    "yyyy-MM-dd",
    "dd/MM/yyyy",
    "dd-MM-yyyy",
    "dd.MM.yyyy",
    "d/M/yyyy",
    "d-M-yyyy",
    "d.M.yyyy",
    "dd/MM/yy",
    "dd-MM-yy",
    "d/M/yy",
    "dd MMM yyyy",
    "d MMM yyyy",
    "dd MMMM yyyy",
    "d MMMM yyyy",
    "MMM dd, yyyy",
    "MMMM dd, yyyy",
  ];

  for (const pattern of formats) {
    const parsed = parse(value, pattern, new Date());

    if (isValid(parsed)) {
      let year = parsed.getFullYear();

      if (year < 100) {
        year += year >= 70 ? 1900 : 2000;
      }

      if (year >= 1990 && year <= new Date().getFullYear() + 1) {
        const normalized = new Date(year, parsed.getMonth(), parsed.getDate());
        return format(normalized, "yyyy-MM-dd");
      }
    }
  }

  return null;
}

function extractLabeledValue(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (match?.[1]) {
      const value = cleanValue(match[1].replace(/\s+/g, " "));

      if (value.length >= 2 && value.length <= 120) {
        return value;
      }
    }
  }

  return "";
}

function parsePeriodToMonths(amountRaw: string, unitRaw: string) {
  const normalizedAmount = amountRaw.toLowerCase().replace(/\s+/g, " ").trim();
  const compact = normalizedAmount.replace(/\s+/g, "");

  const amount =
    WORD_NUMBERS[normalizedAmount] ??
    WORD_NUMBERS[compact] ??
    Number.parseInt(amountRaw, 10);

  if (Number.isNaN(amount) || amount <= 0) return null;

  const unit = unitRaw.toLowerCase();

  if (
    unit.startsWith("y") ||
    unit.includes("yr") ||
    unit.includes("वर्ष") ||
    unit.includes("साल")
  ) {
    return amount * 12;
  }

  return amount;
}

function extractWarrantyPeriodMonths(text: string, layoutValue = "") {
  const sources = [layoutValue, text].filter(Boolean);

  const patterns = [
    new RegExp(
      `${PERIOD_AMOUNT}\\s*${PERIOD_UNIT}\\s*(?:of\\s*)?${WARRANTY_WORD}`,
      "i"
    ),
    new RegExp(
      `${WARRANTY_WORD}\\s*(?:period|valid(?:ity)?|term|cover(?:age)?|available)?\\s*[:\\-]?\\s*${PERIOD_AMOUNT}\\s*${PERIOD_UNIT}`,
      "i"
    ),
    new RegExp(
      `${WARRANTY_WORD}[^\\n]{0,50}?${PERIOD_AMOUNT}\\s*${PERIOD_UNIT}`,
      "i"
    ),
    new RegExp(
      `${PERIOD_AMOUNT}\\s*${PERIOD_UNIT}[^\\n]{0,50}?${WARRANTY_WORD}`,
      "i"
    ),
    new RegExp(
      `(?:valid|covered|available)\\s*(?:for|:)?\\s*${PERIOD_AMOUNT}\\s*${PERIOD_UNIT}`,
      "i"
    ),
    // Flipkart: Warranty: 1 Year on Device and 6 Months on Accessories
    /(\d{1,2})\s*(years?|yrs?)\s*on\s*device/i,
    /(\d{1,2})\s*(?:yr|yrs|year|years)\s*[+&/]\s*(\d{1,2})\s*(?:mo|mos|month|months)/i,
  ];

  for (const source of sources) {
    for (const pattern of patterns) {
      const match = source.match(pattern);
      if (!match) continue;

      if (match[2] && pattern.source.includes("[+&/]")) {
        const years = Number.parseInt(match[1], 10);
        const months = Number.parseInt(match[2], 10);
        if (!Number.isNaN(years) && !Number.isNaN(months)) {
          return years * 12 + months;
        }
      }

      if (!match[1] || !match[2]) continue;

      const months = parsePeriodToMonths(match[1], match[2]);
      if (months && months > 0 && months <= 120) {
        return months;
      }
    }

    const bare = source.match(
      new RegExp(`^\\s*${PERIOD_AMOUNT}\\s*${PERIOD_UNIT}\\s*$`, "i")
    );
    if (bare?.[1] && bare[2]) {
      const months = parsePeriodToMonths(bare[1], bare[2]);
      if (months && months > 0 && months <= 120) {
        return months;
      }
    }
  }

  return null;
}

function extractInvoiceNumber(text: string, layoutValue = "") {
  const candidates = [
    layoutValue,
    extractLabeledValue(text, [
      /(?:tax\s*)?invoice\s*(?:no|number|num|#|n[o0])\.?\s*[:\-#]?\s*([A-Z0-9][A-Z0-9\-\/]{2,40})/i,
      /(?:bill|receipt|order|cash\s*memo)\s*(?:no|number|num|id|#)\.?\s*[:\-#]?\s*([A-Z0-9][A-Z0-9\-\/]{2,40})/i,
      /bill\s*of\s*supply\s*(?:no|number|#)?\.?\s*[:\-#]?\s*([A-Z0-9][A-Z0-9\-\/]{2,40})/i,
      /inv(?:oice)?[\.\s_-]*(?:no|number|#)?\.?\s*[:\-#]?\s*([A-Z0-9][A-Z0-9\-\/]{2,40})/i,
    ]),
  ];

  for (const candidate of candidates) {
    const value = cleanValue(candidate);
    if (/^[A-Z0-9][A-Z0-9\-\/]{2,40}$/i.test(value)) {
      return value;
    }
  }

  return "";
}

function acceptSerialCandidate(raw: string, requireImeiLuhn: boolean) {
  const value = cleanValue(raw);
  const digits = value.replace(/\D/g, "");

  if (requireImeiLuhn || (digits.length === 15 && /^\d+$/.test(value))) {
    return isValidImei(digits) ? digits : "";
  }

  if (/^[A-Z0-9][A-Z0-9\-\/]{3,40}$/i.test(value)) {
    return value;
  }

  return "";
}

function extractSerialNumber(text: string, layoutValue = "") {
  const imeiLabelled = extractLabeledValue(text, [
    /imei(?:\s*(?:no|number|#|1|2))?\.?\s*[:\-#]?\s*([0-9]{10,20})/i,
    /\[?\s*imei\s*\/\s*serial\s*(?:no|number)?\s*[:\-]?\s*([A-Z0-9]{8,})\s*\]?/i,
  ]);

  const imeiAccepted = acceptSerialCandidate(imeiLabelled, true);
  if (imeiAccepted) return imeiAccepted;

  const candidates = [
    layoutValue,
    extractLabeledValue(text, [
      /(?:serial(?:\s*(?:no|number|#))?|sr\.?\s*no|s\/n|sl\.?\s*no|sno)\.?\s*[:\-#]?\s*([A-Z0-9][A-Z0-9\-\/]{3,40})/i,
      /(?:chassis|device)\s*(?:no|number|#)?\.?\s*[:\-#]?\s*([A-Z0-9][A-Z0-9\-\/]{4,40})/i,
    ]),
  ];

  for (const candidate of candidates) {
    const accepted = acceptSerialCandidate(candidate, false);
    if (accepted) return accepted;
  }

  return "";
}

function extractPurchaseDate(
  text: string,
  layoutValue = ""
): { value: string; labelled: boolean } {
  const tryParse = (raw: string) => {
    const direct = parseDateCandidate(raw);
    if (direct) return direct;

    const embedded = raw.match(
      /\b([0-9]{1,2}[\/\-.][0-9]{1,2}[\/\-.][0-9]{2,4}|[0-9]{4}[\/\-.][0-9]{1,2}[\/\-.][0-9]{1,2}|[0-9]{1,2}\s+[A-Za-z]{3,9}\s*,?\s*[0-9]{4})\b/
    );
    return embedded?.[1] ? parseDateCandidate(embedded[1]) : null;
  };

  if (layoutValue) {
    const parsed = tryParse(layoutValue);
    if (parsed) return { value: parsed, labelled: true };
  }

  const labeled = extractLabeledValue(text, [
    /(?:date\s*of\s*purchase|purchase\s*date|invoice\s*date|bill\s*date|order\s*date|dated|sold\s*on|date)\s*[:\-]?\s*([0-9]{1,2}[\/\-.][0-9]{1,2}[\/\-.][0-9]{2,4})/i,
    /(?:date\s*of\s*purchase|purchase\s*date|invoice\s*date|bill\s*date|order\s*date|dated|sold\s*on|date)\s*[:\-]?\s*([0-9]{4}[\/\-.][0-9]{1,2}[\/\-.][0-9]{1,2})/i,
    /(?:date\s*of\s*purchase|purchase\s*date|invoice\s*date|bill\s*date|order\s*date|dated|sold\s*on|date)\s*[:\-]?\s*([0-9]{1,2}\s*[A-Za-z]{3,9}\s*,?\s*[0-9]{4})/i,
  ]);

  if (labeled) {
    const parsed = tryParse(labeled);
    if (parsed) return { value: parsed, labelled: true };
  }

  const datePatterns = [
    /\b([0-9]{1,2}[\/\-.][0-9]{1,2}[\/\-.][0-9]{4})\b/g,
    /\b([0-9]{1,2}[\/\-.][0-9]{1,2}[\/\-.][0-9]{2})\b/g,
    /\b([0-9]{4}[\/\-.][0-9]{1,2}[\/\-.][0-9]{1,2})\b/g,
    /\b([0-9]{1,2}\s+[A-Za-z]{3,9}\s*,?\s*[0-9]{4})\b/g,
  ];

  for (const pattern of datePatterns) {
    for (const match of text.matchAll(pattern)) {
      const parsed = parseDateCandidate(match[1]);
      if (parsed) return { value: parsed, labelled: false };
    }
  }

  return { value: "", labelled: false };
}

function extractSellerGstin(text: string): { value: string; labelled: boolean } {
  const labelled = extractLabeledValue(text, [
    /(?:seller|supplier|tax)?\s*gstin(?:\s*(?:no|number|#))?\.?\s*[:\-#]?\s*([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z])/i,
  ]);

  if (labelled && isValidGstin(labelled)) {
    return { value: labelled.toUpperCase(), labelled: true };
  }

  const found = findGstins(text);
  if (found[0]) {
    return { value: found[0], labelled: false };
  }

  return { value: "", labelled: false };
}

function extractPurchaseAmount(text: string) {
  const patterns = [
    /(?:grand\s*total|invoice\s*value|total\s*invoice\s*value|amount\s*payable)\s*[:\-]?\s*(?:₹|rs\.?|inr)?\s*([\d,]+\.?\d*)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match?.[1]) continue;

    const amount = Number.parseFloat(match[1].replace(/,/g, ""));
    if (Number.isFinite(amount) && amount > 0) {
      return String(amount);
    }
  }

  return "";
}

function canonicalizeBrand(raw: string) {
  const trimmed = raw.trim();
  const found = COMMON_BRANDS.find(
    (brand) => brand.toLowerCase() === trimmed.toLowerCase()
  );
  return found ?? trimmed;
}

function extractBrand(text: string, layoutValue = "") {
  if (layoutValue) {
    const knownFromLayout = COMMON_BRANDS.find((brand) =>
      layoutValue.toLowerCase().includes(brand.toLowerCase())
    );
    if (knownFromLayout && !/^(amazon|croma)$/i.test(knownFromLayout)) {
      return canonicalizeBrand(knownFromLayout);
    }

    const firstToken = cleanValue(layoutValue).split(/\s+/)[0];
    if (firstToken && /^[A-Za-z][A-Za-z0-9&.-]{1,20}$/.test(firstToken)) {
      // Avoid treating marketplace sellers as brands
      if (!/amazon|flipkart|retail|private|limited|pvt/i.test(firstToken)) {
        return canonicalizeBrand(firstToken);
      }
    }
  }

  const labeled = extractLabeledValue(text, [
    /brand\s*[:\-]?\s*([A-Za-z0-9][A-Za-z0-9&.\-]{0,30}(?:\s+[A-Za-z0-9][A-Za-z0-9&.\-]{0,20}){0,2})/i,
    /manufacturer\s*[:\-]?\s*([A-Za-z0-9][A-Za-z0-9&.\-]{0,30}(?:\s+[A-Za-z0-9][A-Za-z0-9&.\-]{0,20}){0,2})/i,
    /make\s*[:\-]?\s*([A-Za-z0-9][A-Za-z0-9&.\-]{0,30})/i,
  ]);

  if (labeled) {
    const known = COMMON_BRANDS.find((brand) =>
      labeled.toLowerCase().startsWith(brand.toLowerCase())
    );
    return canonicalizeBrand(known ?? labeled.split(/\s+/)[0]);
  }

  const brandsByLength = [...COMMON_BRANDS].sort(
    (a, b) => b.length - a.length
  );

  for (const brand of brandsByLength) {
    if (/^(amazon|croma)$/i.test(brand)) continue;
    const escaped = brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`\\b${escaped}\\b`, "i").test(text)) {
      return canonicalizeBrand(brand);
    }
  }

  return "";
}

function scoreProductLine(line: string, brand: string) {
  let score = 0;
  const cleaned = stripTrailingMoney(line);

  if (PRODUCT_HINT.test(cleaned)) score += 4;
  if (brand && cleaned.toLowerCase().includes(brand.toLowerCase())) score += 3;
  if (/[A-Za-z].*\d|\d.*[A-Za-z]/.test(cleaned)) score += 2;
  if (
    /\b(pro|max|plus|ultra|air|mini|series|gen|rog|zephyrus|macbook|iphone|galaxy|nanoflare)\b/i.test(
      cleaned
    )
  ) {
    score += 2;
  }
  if (cleaned.length >= 8 && cleaned.length <= 100) score += 1;
  if (/₹|rs\.?/i.test(line)) score += 1;
  if (/\bB0[A-Z0-9]{8,}\b/i.test(line)) score += 1; // Amazon ASIN nearby

  return score;
}

function extractProductName(text: string, brand: string, layoutValue = "") {
  if (layoutValue) {
    const cleaned = stripTrailingMoney(layoutValue)
      .replace(/^\d+\s+/, "")
      .replace(/\s*\(\s*B0[A-Z0-9]+.*$/i, "")
      .replace(/\s*FSN\s*:.*$/i, "")
      .trim();
    if (isPlausibleProductLine(cleaned) && !/^(title|description|particulars|name)$/i.test(cleaned)) {
      return cleaned.slice(0, 140);
    }
  }

  const labeled = extractLabeledValue(text, [
    /product\s*title\s*[:\-]?\s*([^\n]{5,140})/i,
    /item\s*(?:name|title|description)\s*[:\-]?\s*([^\n]{5,140})/i,
    /product\s*(?:name|description)\s*[:\-]?\s*([^\n]{5,140})/i,
    /(?:particulars|goods\s*description)\s*[:\-]?\s*([^\n]{5,140})/i,
    /(?:^|\n)\s*description\s*[:\-]\s*([^\n]{5,140})/i,
    /model(?:\s*name)?\s*[:\-]\s*([^\n]{3,100})/i,
  ]);

  if (labeled) {
    const cleaned = stripTrailingMoney(labeled)
      .replace(/^\d+\s+/, "")
      .trim();
    if (
      isPlausibleProductLine(cleaned) &&
      !/^(title|description|particulars|name)$/i.test(cleaned)
    ) {
      return cleaned.split(/\s{2,}/)[0].trim().slice(0, 140);
    }
  }

  const lines = getLines(text);
  let best = "";
  let bestScore = 0;

  for (const line of lines) {
    if (!isPlausibleProductLine(line)) continue;
    if (matchLabelKey(line)) continue;
    if (/^(title|description|particulars|name)$/i.test(line)) continue;

    const score = scoreProductLine(line, brand);
    if (score > bestScore) {
      bestScore = score;
      best = stripTrailingMoney(line)
        .replace(/^\d+\s+/, "")
        .replace(/\s*\(\s*B0[A-Z0-9]+.*$/i, "")
        .slice(0, 140);
    }
  }

  if (bestScore >= 3) return best;

  for (const line of lines) {
    if (!isPlausibleProductLine(line)) continue;
    if (brand && line.toLowerCase().includes(brand.toLowerCase())) {
      return stripTrailingMoney(line).replace(/^\d+\s+/, "").slice(0, 140);
    }
  }

  return best;
}

function extractModel(text: string) {
  return extractLabeledValue(text, [
    /model(?:\s*name|\s*no|\s*number)?\s*[:\-]\s*([A-Za-z0-9][^\n]{1,80})/i,
  ]).slice(0, 80);
}

function finalizePurchaseDate(value: string) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return parseDateCandidate(value) ?? "";
}

function metaFor(
  usedLayout: boolean,
  labelledFallback: boolean,
  confidence: FieldConfidence = usedLayout || labelledFallback ? "high" : "medium"
): { source: FieldSource; confidence: FieldConfidence } {
  return {
    source: usedLayout ? "layout" : "regex",
    confidence,
  };
}

export function extractFieldsFromText(rawText: string): ExtractedDocumentFields {
  const text = normalizeText(rawText);

  if (!text) {
    return emptyExtractedFields();
  }

  const retailer = detectRetailer(text);
  const pairs = buildLayoutPairs(text);

  const layoutName = firstLayoutValue(pairs, "name");
  const layoutBrand = firstLayoutValue(pairs, "brand");
  const layoutSerial = firstLayoutValue(pairs, "serialNumber");
  const layoutInvoice = firstLayoutValue(pairs, "invoiceNumber");
  const layoutDate = firstLayoutValue(pairs, "purchaseDate");
  const layoutWarranty = firstLayoutValue(pairs, "warrantyPeriod");

  const brand = extractBrand(text, layoutBrand);
  const purchaseDate = extractPurchaseDate(text, layoutDate);
  const gstin = extractSellerGstin(text);
  const purchaseAmount = extractPurchaseAmount(text);

  const base = emptyExtractedFields();
  base.name = extractProductName(text, brand, layoutName);
  base.brand = brand;
  base.serialNumber = extractSerialNumber(text, layoutSerial);
  base.invoiceNumber = extractInvoiceNumber(text, layoutInvoice);
  base.purchaseDate = purchaseDate.value;
  base.warrantyPeriod = extractWarrantyPeriodMonths(text, layoutWarranty);
  base.sellerGstin = gstin.value;
  base.purchaseAmount = purchaseAmount;
  base.model = extractModel(text);
  base.retailer = retailerDisplayName(retailer);
  base.category = inferCategory(base.name, text);

  if (base.name) {
    setFieldMeta(base, "name", metaFor(Boolean(layoutName), false, layoutName ? "high" : "medium"));
  }
  if (base.brand) {
    setFieldMeta(
      base,
      "brand",
      metaFor(Boolean(layoutBrand), /brand\s*[:\-]/i.test(text), layoutBrand ? "high" : "medium")
    );
  }
  if (base.serialNumber) {
    setFieldMeta(base, "serialNumber", metaFor(Boolean(layoutSerial), /imei|serial/i.test(text), "high"));
  }
  if (base.invoiceNumber) {
    setFieldMeta(base, "invoiceNumber", metaFor(Boolean(layoutInvoice), true, "high"));
  }
  if (base.purchaseDate) {
    setFieldMeta(
      base,
      "purchaseDate",
      metaFor(Boolean(layoutDate), purchaseDate.labelled, purchaseDate.labelled ? "high" : "low")
    );
  }
  if (base.warrantyPeriod) {
    setFieldMeta(
      base,
      "warrantyPeriod",
      metaFor(Boolean(layoutWarranty), false, layoutWarranty ? "high" : "medium")
    );
  }
  if (base.sellerGstin) {
    setFieldMeta(
      base,
      "sellerGstin",
      { source: "regex", confidence: gstin.labelled ? "high" : "medium" }
    );
  }
  if (base.purchaseAmount) {
    setFieldMeta(base, "purchaseAmount", { source: "regex", confidence: "high" });
  }
  if (base.model) {
    setFieldMeta(base, "model", { source: "regex", confidence: "high" });
  }
  if (base.retailer) {
    setFieldMeta(base, "retailer", { source: "retailer", confidence: "medium" });
  }
  if (base.category) {
    setFieldMeta(base, "category", { source: "regex", confidence: "medium" });
  }

  const boosted = applyRetailerBoosts(text, retailer, base);
  const digits = boosted.serialNumber.replace(/\D/g, "");

  if (
    digits.length === 15 &&
    /imei/i.test(text) &&
    !isValidImei(digits)
  ) {
    boosted.serialNumber = "";
    delete boosted.fieldMeta.serialNumber;
  }

  if (!base.invoiceNumber && boosted.invoiceNumber) {
    setFieldMeta(boosted, "invoiceNumber", { source: "retailer", confidence: "medium" });
  }
  if (!base.serialNumber && boosted.serialNumber) {
    setFieldMeta(boosted, "serialNumber", { source: "retailer", confidence: "medium" });
  }
  if (!base.name && boosted.name) {
    setFieldMeta(boosted, "name", { source: "retailer", confidence: "medium" });
  }
  if (!base.purchaseDate && boosted.purchaseDate) {
    setFieldMeta(boosted, "purchaseDate", { source: "retailer", confidence: "medium" });
  }
  if (!base.warrantyPeriod && boosted.warrantyPeriod) {
    setFieldMeta(boosted, "warrantyPeriod", { source: "retailer", confidence: "medium" });
  }

  return {
    ...boosted,
    purchaseDate: finalizePurchaseDate(boosted.purchaseDate),
    name: stripTrailingMoney(boosted.name).slice(0, 140),
    category: boosted.category || inferCategory(boosted.name, text),
    retailer: boosted.retailer || retailerDisplayName(retailer),
  };
}
