import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

import { getSessionUser } from "@/lib/product-access";

// GEMINI_API_KEY required. GEMINI_MODEL optional (default gemini-2.5-flash).
// If 429 persists, enable billing in Google AI Studio or wait for free-tier reset.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

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
  const arrayBuffer = await response.arrayBuffer();
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
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { success: false, error: "OCR is not configured" },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { imageUrl } = body;

    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json(
        { success: false, error: "imageUrl is required" },
        { status: 400 }
      );
    }

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

    return NextResponse.json({
      success: true,
      result: parsed,
    });
  } catch (error) {
    console.error("OCR ERROR:", error);

    if (isQuotaError(error)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "AI scanning is temporarily unavailable (quota limit). Enter details manually or try again later.",
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Could not extract details. Enter them manually.",
      },
      { status: 500 }
    );
  }
}
