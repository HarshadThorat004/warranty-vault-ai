import jsQR from "jsqr";
import sharp from "sharp";

import { parse } from "date-fns";

import {
  emptyExtractedFields,
  setFieldMeta,
  type ExtractedDocumentFields,
} from "@/lib/document-extract/types";
import { isValidGstin } from "@/lib/document-extract/validate";

type GstQrPayload = {
  SellerGstin?: string;
  BuyerGstin?: string;
  DocNo?: string;
  DocTyp?: string;
  DocDt?: string;
  TotInvVal?: string | number;
  ItemCnt?: string | number;
  MainHsnCode?: string;
  Irn?: string;
};

const MAX_QR_DECODE_WIDTH = 2200;

export function parseGstQrPayload(raw: string): ExtractedDocumentFields | null {
  const parsed = coercePayload(raw);

  if (!parsed) {
    return null;
  }

  const fields = emptyExtractedFields();
  const invoiceNumber = cleanToken(parsed.DocNo);
  const sellerGstin = cleanToken(parsed.SellerGstin).toUpperCase();
  const purchaseDate = parseDocDate(parsed.DocDt);
  const purchaseAmount = normalizeAmount(parsed.TotInvVal);

  if (invoiceNumber && /^[A-Z0-9][A-Z0-9\-\/]{2,40}$/i.test(invoiceNumber)) {
    fields.invoiceNumber = invoiceNumber;
    setFieldMeta(fields, "invoiceNumber", { source: "qr", confidence: "high" });
  }

  if (purchaseDate) {
    fields.purchaseDate = purchaseDate;
    setFieldMeta(fields, "purchaseDate", { source: "qr", confidence: "high" });
  }

  if (sellerGstin && isValidGstin(sellerGstin)) {
    fields.sellerGstin = sellerGstin;
    setFieldMeta(fields, "sellerGstin", { source: "qr", confidence: "high" });
  }

  if (purchaseAmount) {
    fields.purchaseAmount = purchaseAmount;
    setFieldMeta(fields, "purchaseAmount", { source: "qr", confidence: "high" });
  }

  if (
    !fields.invoiceNumber &&
    !fields.purchaseDate &&
    !fields.sellerGstin &&
    !fields.purchaseAmount
  ) {
    return null;
  }

  return fields;
}

export async function decodeGstQrFromImage(
  buffer: Buffer
): Promise<ExtractedDocumentFields | null> {
  const payloads = await collectQrPayloads(buffer);

  for (const payload of payloads) {
    const fields = parseGstQrPayload(payload);
    if (fields) return fields;
  }

  return null;
}

async function collectQrPayloads(buffer: Buffer) {
  const payloads: string[] = [];
  const meta = await sharp(buffer).rotate().metadata();
  const width = meta.width ?? 0;

  const decodeWidth =
    width > 0 ? Math.min(width, MAX_QR_DECODE_WIDTH) : MAX_QR_DECODE_WIDTH;

  const full = await decodeBuffer(buffer, decodeWidth);
  if (full) payloads.push(full);

  // GST e-invoice QR is usually in a corner — crop if the full pass missed.
  if (payloads.length === 0 && width >= 400) {
    const cropped = await decodeCornerCrops(buffer);
    payloads.push(...cropped);
  }

  return payloads;
}

async function decodeCornerCrops(buffer: Buffer) {
  const image = sharp(buffer).rotate();
  const meta = await image.metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;

  if (!width || !height) return [];

  const cropW = Math.floor(width / 2);
  const cropH = Math.floor(height / 2);
  const origins = [
    { left: 0, top: 0 },
    { left: width - cropW, top: 0 },
    { left: 0, top: height - cropH },
    { left: width - cropW, top: height - cropH },
  ];

  const found: string[] = [];

  for (const origin of origins) {
    const crop = await image
      .clone()
      .extract({ ...origin, width: cropW, height: cropH })
      .toBuffer();
    const text = await decodeBuffer(crop, Math.min(cropW, MAX_QR_DECODE_WIDTH));
    if (text) found.push(text);
  }

  return found;
}

async function decodeBuffer(buffer: Buffer, width?: number) {
  let pipeline = sharp(buffer).rotate().ensureAlpha();

  if (width) {
    pipeline = pipeline.resize({ width, withoutEnlargement: true });
  }

  const { data, info } = await pipeline.raw().toBuffer({
    resolveWithObject: true,
  });

  if (info.channels !== 4) {
    return null;
  }

  const pixels = new Uint8ClampedArray(data.byteLength);
  pixels.set(data);

  const result = jsQR(pixels, info.width, info.height, {
    inversionAttempts: "attemptBoth",
  });

  return result?.data?.trim() || null;
}

function coercePayload(raw: string): GstQrPayload | null {
  const trimmed = raw.trim();

  if (!trimmed) return null;

  const jwt = decodeJwtPayload(trimmed);
  if (jwt) return pickGstFields(jwt);

  const json = decodeJsonObject(trimmed);
  if (json) return pickGstFields(json);

  return null;
}

function decodeJwtPayload(raw: string) {
  const parts = raw.split(".");
  if (parts.length !== 3) return null;

  try {
    const payload = parts[1] ?? "";
    const padded = payload.replace(/-/g, "+").replace(/_/g, "/");
    const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
    const json = Buffer.from(`${padded}${pad}`, "base64").toString("utf8");
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function decodeJsonObject(raw: string) {
  if (!raw.startsWith("{")) return null;

  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    try {
      const quoted = quoteUnquotedJson(raw);
      return JSON.parse(quoted) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}

function quoteUnquotedJson(raw: string) {
  return raw
    .replace(/([{,]\s*)([A-Za-z][A-Za-z0-9_]*)\s*:/g, '$1"$2":')
    .replace(/:\s*([^",{\[\]}\s][^,}]*)/g, (_match, value: string) => {
      const trimmed = value.trim().replace(/,+$/, "");
      if (/^-?\d+(\.\d+)?$/.test(trimmed) || trimmed === "true" || trimmed === "false") {
        return `: ${trimmed}`;
      }
      return `: "${trimmed.replace(/"/g, "")}"`;
    });
}

function pickGstFields(input: Record<string, unknown>): GstQrPayload {
  const lower: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    lower[key.toLowerCase()] = value;
  }

  return {
    SellerGstin: stringField(lower, "sellergstin"),
    BuyerGstin: stringField(lower, "buyergstin"),
    DocNo: stringField(lower, "docno"),
    DocTyp: stringField(lower, "doctyp"),
    DocDt: stringField(lower, "docdt"),
    TotInvVal: numberOrStringField(lower, "totinvval"),
    ItemCnt: numberOrStringField(lower, "itemcnt"),
    MainHsnCode: stringField(lower, "mainhsncode"),
    Irn: stringField(lower, "irn"),
  };
}

function stringField(map: Record<string, unknown>, key: string) {
  const value = map[key];
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : undefined;
}

function numberOrStringField(map: Record<string, unknown>, key: string) {
  const value = map[key];
  if (typeof value === "number" || typeof value === "string") return value;
  return undefined;
}

function cleanToken(value?: string) {
  return (value ?? "").replace(/^[\s"']+|[\s"']+$/g, "").trim();
}

function parseDocDate(raw?: string) {
  const value = cleanToken(raw);
  if (!value) return "";

  const formats = ["dd/MM/yyyy", "d/M/yyyy", "dd-MM-yyyy", "yyyy-MM-dd"];

  for (const pattern of formats) {
    const parsed = parse(value, pattern, new Date());
    if (!Number.isNaN(parsed.getTime())) {
      const year = parsed.getFullYear();
      if (year >= 1990 && year <= new Date().getFullYear() + 1) {
        const month = String(parsed.getMonth() + 1).padStart(2, "0");
        const day = String(parsed.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      }
    }
  }

  return "";
}

function normalizeAmount(raw?: string | number) {
  if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) {
    return String(raw);
  }

  if (typeof raw !== "string") return "";

  const cleaned = raw.replace(/[₹,\s]/g, "").replace(/rs\.?/i, "");
  const amount = Number.parseFloat(cleaned);

  if (!Number.isFinite(amount) || amount <= 0) return "";

  return String(amount);
}
