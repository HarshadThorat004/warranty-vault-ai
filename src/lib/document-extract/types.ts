export type ExtractedFieldKey =
  | "name"
  | "brand"
  | "serialNumber"
  | "invoiceNumber"
  | "purchaseDate"
  | "warrantyPeriod"
  | "sellerGstin"
  | "purchaseAmount"
  | "model"
  | "retailer"
  | "category";

export type FieldSource = "qr" | "layout" | "regex" | "retailer" | "vision";

export type FieldConfidence = "high" | "medium" | "low";

export type FieldMeta = {
  source: FieldSource;
  confidence: FieldConfidence;
};

export type ExtractedDocumentFields = {
  name: string;
  brand: string;
  serialNumber: string;
  invoiceNumber: string;
  purchaseDate: string;
  warrantyPeriod: number | null;
  sellerGstin: string;
  purchaseAmount: string;
  model: string;
  retailer: string;
  category: string;
  fieldMeta: Partial<Record<ExtractedFieldKey, FieldMeta>>;
};

export const SCAN_FAILED_MESSAGE = "Sorry, unable to scan — enter manually.";

export function emptyExtractedFields(): ExtractedDocumentFields {
  return {
    name: "",
    brand: "",
    serialNumber: "",
    invoiceNumber: "",
    purchaseDate: "",
    warrantyPeriod: null,
    sellerGstin: "",
    purchaseAmount: "",
    model: "",
    retailer: "",
    category: "",
    fieldMeta: {},
  };
}

export const EMPTY_EXTRACTED_FIELDS: ExtractedDocumentFields =
  emptyExtractedFields();

export function countExtractedFields(fields: ExtractedDocumentFields) {
  let count = 0;

  if (fields.name.trim()) count += 1;
  if (fields.brand.trim()) count += 1;
  if (fields.serialNumber.trim()) count += 1;
  if (fields.invoiceNumber.trim()) count += 1;
  if (fields.purchaseDate.trim()) count += 1;
  if (fields.warrantyPeriod && fields.warrantyPeriod > 0) count += 1;

  return count;
}

export function setFieldMeta(
  fields: ExtractedDocumentFields,
  key: ExtractedFieldKey,
  meta: FieldMeta
) {
  fields.fieldMeta[key] = meta;
}
