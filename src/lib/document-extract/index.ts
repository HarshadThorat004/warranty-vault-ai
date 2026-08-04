import { extractFieldsFromText } from "@/lib/document-extract/field-extractors";
import { isGeminiOcrEnabled, extractWithGemini } from "@/lib/document-extract/gemini-extract";
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

export async function scanDocumentFromUrl(
  url: string
): Promise<ExtractedDocumentFields> {
  const { buffer, mimeType } = await fetchDocumentBuffer(url);

  if (isGeminiOcrEnabled() && mimeType.startsWith("image/")) {
    const base64 = buffer.toString("base64");
    return extractWithGemini(base64, mimeType);
  }

  const text = await extractTextFromDocument(buffer, mimeType);
  const fields = extractFieldsFromText(text);

  if (countExtractedFields(fields) === 0) {
    throw new Error(SCAN_FAILED_MESSAGE);
  }

  return fields;
}
