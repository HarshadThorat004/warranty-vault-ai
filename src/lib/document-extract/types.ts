export type ExtractedDocumentFields = {
  name: string;
  brand: string;
  serialNumber: string;
  invoiceNumber: string;
  purchaseDate: string;
  warrantyPeriod: number | null;
};

export const EMPTY_EXTRACTED_FIELDS: ExtractedDocumentFields = {
  name: "",
  brand: "",
  serialNumber: "",
  invoiceNumber: "",
  purchaseDate: "",
  warrantyPeriod: null,
};

export const SCAN_FAILED_MESSAGE =
  "Sorry, unable to scan — enter manually.";

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
