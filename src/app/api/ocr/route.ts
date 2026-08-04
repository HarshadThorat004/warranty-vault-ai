import { jsonError, jsonSuccess } from "@/lib/api";
import { GoogleGenerativeAI } from "@google/generative-ai";

import { getSessionUser } from "@/lib/product-access";
import { consumeRateLimit } from "@/lib/rate-limit";
import { assertAllowedRemoteUrl } from "@/lib/url-allowlist";

// GEMINI_API_KEY required. GEMINI_MODEL optional (default gemini-2.5-flash).
// If 429 persists, enable billing in Google AI Studio or wait for free-tier reset.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const MAX_OCR_IMAGE_BYTES = 8 * 1024 * 1024;

function getMimeType(url: string, contentType?: string | null) {
  if (contentType && contentType.startsWith("image/")) {
    return contentType;
  }

  const lower = url.toLowerCase();

  if (lower.includes(".jpg") || lower.includes(".jpeg")) {
    return "image/jpeg";
  }

  if (lower.includes(".webp")) {
    return "image/webp";
  }

  if (lower.includes(".gif")) {
    return "image/gif";
  }

  return "image/png";
}

async function imageUrlToBase64(url: string) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch image for OCR");
  }

  const contentType = response.headers.get("content-type");
  const contentLength = Number(response.headers.get("content-length") ?? "0");

  if (contentLength > MAX_OCR_IMAGE_BYTES) {
    throw new Error("Uploaded image is too large for OCR");
  }

  const arrayBuffer = await response.arrayBuffer();

  if (arrayBuffer.byteLength > MAX_OCR_IMAGE_BYTES) {
    throw new Error("Uploaded image is too large for OCR");
  }

  const base64 = Buffer.from(arrayBuffer).toString("base64");

  return {
    base64,
    mimeType: getMimeType(url, contentType),
  };
}

function isQuotaError(error: unknown) {
  const message =
    error instanceof Error ? error.message : String(error ?? "");
  const lower = message.toLowerCase();

  return (
    lower.includes("429") ||
    lower.includes("too many requests") ||
    lower.includes("quota") ||
    lower.includes("rate-limit") ||
    lower.includes("rate limit")
  );
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return jsonError("Unauthorized", 401);
    }

    if (!process.env.GEMINI_API_KEY) {
      return jsonError("OCR is not configured", 503);
    }

    const rateLimit = consumeRateLimit({
      key: `ocr:${user.id}`,
      limit: 20,
      windowMs: 60 * 60 * 1000,
    });

    if (!rateLimit.success) {
      return jsonError("OCR limit reached. Please try again later.", 429);
    }

    const body = await req.json();
    const { imageUrl } = body;

    if (!imageUrl || typeof imageUrl !== "string") {
      return jsonError("imageUrl is required", 400);
    }

    assertAllowedRemoteUrl(imageUrl);

    const { base64, mimeType } = await imageUrlToBase64(imageUrl);

    const model = genAI.getGenerativeModel({
      model: modelName,
    });

    const result = await model.generateContent([
      `
Extract product details from this invoice or warranty image.

Return ONLY valid raw JSON.

{
  "name": "",
  "brand": "",
  "serialNumber": "",
  "purchaseDate": "",
  "warrantyPeriod": ""
}

Rules:
- Use empty string "" for any field not clearly present — never invent values
- purchaseDate must be YYYY-MM-DD
- warrantyPeriod must be number only in months
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

    const parsed = JSON.parse(cleaned);

    return jsonSuccess({
      success: true,
      result: parsed,
    });
  } catch (error) {
    console.error("OCR ERROR:", error);

    if (isQuotaError(error)) {
      return jsonError(
        "AI scanning is temporarily unavailable (quota limit). Enter details manually or try again later.",
        429
      );
    }

    if (error instanceof Error && error.message === "Only approved uploaded image URLs are allowed") {
      return jsonError(error.message, 400);
    }

    if (error instanceof Error && error.message === "Uploaded image is too large for OCR") {
      return jsonError(error.message, 413);
    }

    return jsonError("Could not extract details. Enter them manually.");
  }
}
