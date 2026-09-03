import { extractFieldsFromText } from "@/lib/document-extract/field-extractors";
import { isGeminiOcrEnabled, extractWithGemini } from "@/lib/document-extract/gemini-extract";
import { decodeGstQrFromImage, parseGstQrPayload } from "@/lib/document-extract/gst-qr";
import { mergeExtractedFields } from "@/lib/document-extract/merge";
import {
  countExtractedFields,
  SCAN_FAILED_MESSAGE,
  type ExtractedDocumentFields,
} from "@/lib/document-extract/types";
import {
  extractTextFromDocument,
  fetchDocumentBuffer,
} from "@/lib/document-extract/text-source";

export {
  SCAN_FAILED_MESSAGE,
  countExtractedFields,
  type ExtractedDocumentFields,
};

export { detectRetailer } from "@/lib/document-extract/aliases";
export { extractFieldsFromText } from "@/lib/document-extract/field-extractors";
export { parseGstQrPayload } from "@/lib/document-extract/gst-qr";
export { canAutofillField } from "@/lib/document-extract/apply-scan";
export { mergeByDocumentType } from "@/lib/document-extract/merge-scan";
export type { ScanDocumentType } from "@/lib/document-extract/merge-scan";

const MAX_CLIENT_TEXT_CHARS = 120_000;

export function scanDocumentFromText(
  text: string,
  qrPayload?: string | null
): ExtractedDocumentFields {
  if (text.length > MAX_CLIENT_TEXT_CHARS) {
    throw new Error("Document is too large for scanning");
  }

  const fields = extractFieldsFromText(text);
  const qr = qrPayload ? parseGstQrPayload(qrPayload) : null;
  const merged = qr ? mergeExtractedFields(fields, qr) : fields;

  if (countExtractedFields(merged) === 0) {
    throw new Error(SCAN_FAILED_MESSAGE);
  }

  return merged;
}

export async function scanDocumentFromBuffer(
  buffer: Buffer,
  mimeType: string
): Promise<ExtractedDocumentFields> {
  let qrFields: ExtractedDocumentFields | null = null;

  if (mimeType.startsWith("image/")) {
    try {
      qrFields = await decodeGstQrFromImage(buffer);
    } catch (error) {
      console.error("GST QR decode failed:", error);
    }
  }

  if (isGeminiOcrEnabled() && mimeType.startsWith("image/")) {
    const base64 = buffer.toString("base64");
    const vision = await extractWithGemini(base64, mimeType);
    const merged = qrFields ? mergeExtractedFields(vision, qrFields) : vision;

    if (countExtractedFields(merged) === 0) {
      throw new Error(SCAN_FAILED_MESSAGE);
    }

    return merged;
  }

  const text = await extractTextFromDocument(buffer, mimeType);
  const fields = extractFieldsFromText(text);
  const merged = qrFields ? mergeExtractedFields(fields, qrFields) : fields;

  if (countExtractedFields(merged) === 0) {
    throw new Error(SCAN_FAILED_MESSAGE);
  }

  return merged;
}

export async function scanDocumentFromUrl(
  url: string
): Promise<ExtractedDocumentFields> {
  const { buffer, mimeType } = await fetchDocumentBuffer(url);
  return scanDocumentFromBuffer(buffer, mimeType);
}
