import type { ExtractedDocumentFields } from "@/lib/document-extract/types";
import type { RetailerId } from "@/lib/document-extract/aliases";
import { isValidImei } from "@/lib/document-extract/validate";

/**
 * Retailer-specific boosters for popular Indian invoice formats.
 * Fills gaps left by generic label parsing.
 */

function clean(value: string) {
  return value.replace(/^[\s:=#\-•*|[\]]+|[\s:=#\-•*|[\]]+$/g, "").trim();
}

function firstMatch(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const value = clean(match[1]);
      if (value.length >= 3) return value;
    }
  }
  return "";
}

export function boostInvoiceNumber(text: string, retailer: RetailerId) {
  const patterns: RegExp[] = [
    // Amazon: 406-9607682-5448349
    /\b(?:order\s*(?:number|no|id|#)?\s*[:\-]?\s*)(\d{3}-\d{7}-\d{7})\b/i,
    /\b(\d{3}-\d{7}-\d{7})\b/,
    // Flipkart: OD435013516609339100
    /\b(?:order\s*(?:id|number|no|#)?\s*[:\-]?\s*)(OD\d{10,})\b/i,
    /\b(OD\d{10,})\b/i,
    // Invoice Number : POD-26-178838497 / FBF1526004495780 / MXABK27003418999
    /(?:tax\s*)?invoice\s*(?:number|no|#)\s*[:\-#]?\s*([A-Z0-9][A-Z0-9\-\/]{4,40})/i,
    /bill\s*of\s*supply\s*(?:number|no|#)?\s*[:\-#]?\s*([A-Z0-9][A-Z0-9\-\/]{4,40})/i,
    /(?:cash\s*memo|receipt)\s*(?:no|number|#)?\s*[:\-#]?\s*([A-Z0-9][A-Z0-9\-\/]{3,40})/i,
  ];

  if (retailer === "amazon") {
    patterns.unshift(
      /invoice\s*number\s*[:\-]?\s*([A-Z0-9][A-Z0-9\-\/]{4,40})/i,
      /order\s*number\s*[:\-]?\s*(\d{3}-\d{7}-\d{7})/i
    );
  }

  if (retailer === "flipkart") {
    patterns.unshift(
      /order\s*id\s*[:\-]?\s*(OD\d{10,})/i,
      /invoice\s*(?:number|no)\s*#?\s*[:\-]?\s*([A-Z0-9]{8,})/i
    );
  }

  if (retailer === "dmart") {
    patterns.unshift(
      /(?:bill|invoice|receipt)\s*(?:no|number|#)?\s*[:\-]?\s*([A-Z0-9\-\/]{4,})/i,
      /txn(?:\s*id)?\s*[:\-]?\s*([A-Z0-9\-\/]{4,})/i
    );
  }

  return firstMatch(text, patterns);
}

export function boostSerialNumber(text: string) {
  const value = firstMatch(text, [
    // Flipkart style: [IMEI/Serial No: 356805361134937 ]
    /\[?\s*imei\s*\/\s*serial\s*(?:no|number)?\s*[:\-]?\s*([A-Z0-9]{8,})\s*\]?/i,
    /imei(?:\s*(?:no|number|#|1|2))?\s*[:\-]?\s*([0-9]{10,20})/i,
    /serial(?:\s*(?:no|number|#))?\s*[:\-]?\s*([A-Z0-9][A-Z0-9\-\/]{4,40})/i,
    /s\/n\s*[:\-]?\s*([A-Z0-9][A-Z0-9\-\/]{4,40})/i,
    /sr\.?\s*no\.?\s*[:\-]?\s*([A-Z0-9][A-Z0-9\-\/]{4,40})/i,
  ]);

  if (!value) return "";

  const digits = value.replace(/\D/g, "");
  if (digits.length === 15) {
    return isValidImei(digits) ? digits : "";
  }

  return value;
}

export function boostPurchaseDateRaw(text: string, retailer: RetailerId) {
  const patterns: RegExp[] = [
    /(?:invoice\s*date|order\s*date|bill\s*date|date\s*of\s*purchase|purchase\s*date|bill\s*of\s*supply\s*date)\s*[:\-]?\s*([0-9]{1,2}[\/\-.][0-9]{1,2}[\/\-.][0-9]{2,4})/i,
    /(?:invoice\s*date|order\s*date|bill\s*date|date\s*of\s*purchase|purchase\s*date)\s*[:\-]?\s*([0-9]{1,2}\s+[A-Za-z]{3,9}\s*,?\s*[0-9]{4})/i,
    /(?:invoice\s*date|order\s*date)\s*[:\-]?\s*([0-9]{1,2}[\/\-.][0-9]{1,2}[\/\-.][0-9]{2,4})(?:\s*,?\s*\d{1,2}:\d{2})?/i,
  ];

  // Amazon often uses dd.MM.yyyy
  if (retailer === "amazon") {
    patterns.unshift(
      /(?:order\s*date|invoice\s*date)\s*[:\-]?\s*([0-9]{1,2}\.[0-9]{1,2}\.[0-9]{4})/i
    );
  }

  return firstMatch(text, patterns);
}

export function boostProductName(text: string, retailer: RetailerId) {
  const patterns: RegExp[] = [
    /product\s*title\s*[:\-]?\s*\n\s*([^\n]{5,140})/i,
    /product\s*title\s*[:\-]\s*([^\n]{5,140})/i,
    /item\s*(?:name|title|description)\s*[:\-]?\s*\n?\s*([^\n]{5,140})/i,
    /item\s*description\s*[:\-]?\s*\n\s*([^\n]{5,140})/i,
  ];

  if (retailer === "amazon") {
    patterns.unshift(
      /^\s*\d+\s+([A-Z][^\n]{8,120}?)\s*(?:\(|₹|rs\.?)/im
    );
  }

  if (retailer === "flipkart") {
    patterns.unshift(
      /product\s*title\s*\n\s*([^\n]{5,140})/i,
      /(?:handsets?|mobiles?)\s+([^\n]{5,120})/i
    );
  }

  if (retailer === "dmart") {
    patterns.unshift(
      /item\s*description\s*\n\s*([^\n]{5,140})/i
    );
  }

  const value = firstMatch(text, patterns);
  return value
    .replace(/^\d+\s+/, "")
    .replace(/\s*\(\s*B0[A-Z0-9]+.*$/i, "")
    .replace(/\s*FSN\s*:.*$/i, "")
    .replace(/\s*HSN\s*:.*$/i, "")
    .trim();
}

export function boostWarrantyMonths(text: string) {
  const patterns = [
    /warranty\s*[:\-]?\s*(\d{1,2})\s*(years?|yrs?|months?|mos?)/i,
    /(\d{1,2})\s*(years?|yrs?|months?|mos?)\s*(?:on\s*(?:device|product|handset))?/i,
    /warranty\s*[:\-]?\s*(\d{1,2})\s*(years?|yrs?)\s*on\s*device/i,
    /(\d{1,2})\s*(years?|yrs?)\s*(?:manufacturer\s*)?warranty/i,
    /(\d{1,2})\s*(months?|mos?)\s*(?:manufacturer\s*)?(?:warranty|garrantee|guarantee)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match?.[1] || !match[2]) continue;

    const amount = Number.parseInt(match[1], 10);
    if (Number.isNaN(amount) || amount <= 0) continue;

    const unit = match[2].toLowerCase();
    const months = unit.startsWith("y") ? amount * 12 : amount;
    if (months > 0 && months <= 120) return months;
  }

  return null;
}

export function applyRetailerBoosts(
  text: string,
  retailer: RetailerId,
  base: ExtractedDocumentFields
): ExtractedDocumentFields {
  const invoiceNumber =
    base.invoiceNumber || boostInvoiceNumber(text, retailer);
  const serialNumber = base.serialNumber || boostSerialNumber(text);
  const purchaseDateRaw =
    base.purchaseDate || boostPurchaseDateRaw(text, retailer);
  const name = base.name || boostProductName(text, retailer);
  const warrantyPeriod =
    base.warrantyPeriod || boostWarrantyMonths(text);

  return {
    ...base,
    invoiceNumber,
    serialNumber,
    // purchaseDate may still be a raw string from boost — caller re-parses if needed
    purchaseDate: base.purchaseDate || purchaseDateRaw,
    name,
    warrantyPeriod,
  };
}
