import {
  emptyExtractedFields,
  type ExtractedDocumentFields,
  type ExtractedFieldKey,
} from "@/lib/document-extract/types";
import { mergeExtractedFields } from "@/lib/document-extract/merge";

export type ScanDocumentType = "Invoice" | "Warranty Card";

function overlayFields(
  source: ExtractedDocumentFields,
  keys: readonly ExtractedFieldKey[]
) {
  const overlay = emptyExtractedFields();

  for (const key of keys) {
    if (key === "warrantyPeriod") {
      if (source.warrantyPeriod && source.warrantyPeriod > 0) {
        overlay.warrantyPeriod = source.warrantyPeriod;
        if (source.fieldMeta.warrantyPeriod) {
          overlay.fieldMeta.warrantyPeriod = source.fieldMeta.warrantyPeriod;
        }
      }
      continue;
    }

    const value = source[key];
    if (typeof value === "string" && value.trim()) {
      overlay[key] = value;
      if (source.fieldMeta[key]) {
        overlay.fieldMeta[key] = source.fieldMeta[key];
      }
    }
  }

  return overlay;
}

/**
 * Invoice wins identity/date/amount. Warranty card wins serial and period.
 * Name/brand/model fill gaps from whichever document has them.
 */
export function mergeByDocumentType(
  existing: ExtractedDocumentFields,
  incoming: ExtractedDocumentFields,
  incomingType: ScanDocumentType
): ExtractedDocumentFields {
  if (incomingType === "Warranty Card") {
    return mergeExtractedFields(
      existing,
      overlayFields(incoming, [
        "serialNumber",
        "warrantyPeriod",
        "name",
        "brand",
        "model",
        "category",
      ])
    );
  }

  return mergeExtractedFields(
    existing,
    overlayFields(incoming, [
      "invoiceNumber",
      "purchaseDate",
      "purchaseAmount",
      "sellerGstin",
      "retailer",
      "name",
      "brand",
      "model",
      "category",
    ])
  );
}
