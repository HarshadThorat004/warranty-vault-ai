import {
  emptyExtractedFields,
  type ExtractedDocumentFields,
} from "@/lib/document-extract/types";

const STRING_KEYS = [
  "name",
  "brand",
  "serialNumber",
  "invoiceNumber",
  "purchaseDate",
  "sellerGstin",
  "purchaseAmount",
  "model",
  "retailer",
  "category",
] as const;

/**
 * Overlay wins for any non-empty value (used so GST QR beats OCR on the
 * same field). Empty overlay values leave the base intact.
 */
export function mergeExtractedFields(
  base: ExtractedDocumentFields,
  overlay: ExtractedDocumentFields
): ExtractedDocumentFields {
  const merged = emptyExtractedFields();
  merged.fieldMeta = { ...base.fieldMeta };

  for (const key of STRING_KEYS) {
    const overlayValue = overlay[key];
    const baseValue = base[key];

    if (overlayValue.trim()) {
      merged[key] = overlayValue;
      if (overlay.fieldMeta[key]) {
        merged.fieldMeta[key] = overlay.fieldMeta[key];
      }
    } else {
      merged[key] = baseValue;
      if (base.fieldMeta[key]) {
        merged.fieldMeta[key] = base.fieldMeta[key];
      }
    }
  }

  if (overlay.warrantyPeriod && overlay.warrantyPeriod > 0) {
    merged.warrantyPeriod = overlay.warrantyPeriod;
    if (overlay.fieldMeta.warrantyPeriod) {
      merged.fieldMeta.warrantyPeriod = overlay.fieldMeta.warrantyPeriod;
    }
  } else {
    merged.warrantyPeriod = base.warrantyPeriod;
    if (base.fieldMeta.warrantyPeriod) {
      merged.fieldMeta.warrantyPeriod = base.fieldMeta.warrantyPeriod;
    }
  }

  return merged;
}
