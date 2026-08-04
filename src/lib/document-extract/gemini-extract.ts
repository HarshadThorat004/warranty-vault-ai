/**
 * Optional Gemini vision extraction — kept for future use, not wired into the
 * default scan pipeline. Enable only if you explicitly set OCR_USE_GEMINI=true.
 */
import { GoogleGenerativeAI } from "@google/generative-ai";

import type { ExtractedDocumentFields } from "@/lib/document-extract/types";

const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export function isGeminiOcrEnabled() {
  return (
    process.env.OCR_USE_GEMINI === "true" && Boolean(process.env.GEMINI_API_KEY)
  );
}

export async function extractWithGemini(
  base64: string,
  mimeType: string
): Promise<ExtractedDocumentFields> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
  const model = genAI.getGenerativeModel({ model: modelName });

  const result = await model.generateContent([
    `
Extract product details from this invoice or warranty image.

Return ONLY valid raw JSON.

{
  "name": "",
  "brand": "",
  "serialNumber": "",
  "invoiceNumber": "",
  "purchaseDate": "",
  "warrantyPeriod": ""
}

Rules:
- Use empty string "" for any field not clearly present — never invent values
- purchaseDate must be YYYY-MM-DD
- warrantyPeriod must be number only in months
- invoiceNumber only if clearly printed on the document
- serialNumber only if clearly printed on the document
- no markdown
- no explanation
- no backticks
`,
    {
      inlineData: {
        mimeType,
        data: base64,
      },
    },
  ]);

  const text = result.response.text();
  const cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  const parsed = JSON.parse(cleaned) as Partial<ExtractedDocumentFields> & {
    warrantyPeriod?: string | number;
  };

  const warrantyPeriod =
    typeof parsed.warrantyPeriod === "number"
      ? parsed.warrantyPeriod
      : Number.parseInt(String(parsed.warrantyPeriod ?? ""), 10);

  return {
    name: parsed.name?.trim() ?? "",
    brand: parsed.brand?.trim() ?? "",
    serialNumber: parsed.serialNumber?.trim() ?? "",
    invoiceNumber: parsed.invoiceNumber?.trim() ?? "",
    purchaseDate: parsed.purchaseDate?.trim() ?? "",
    warrantyPeriod:
      Number.isFinite(warrantyPeriod) && warrantyPeriod > 0
        ? warrantyPeriod
        : null,
  };
}
