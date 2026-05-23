import { NextResponse } from "next/server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI =
  new GoogleGenerativeAI(
    process.env.GEMINI_API_KEY!
  );

export async function POST(
  req: Request
) {
  try {
    const body = await req.json();

    const { imageUrl } = body;

    console.log(
      "OCR IMAGE URL:",
      imageUrl
    );

    const base64Image =
      await imageUrlToBase64(
        imageUrl
      );

    console.log(
      "BASE64 GENERATED"
    );

    const model =
      genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
      });

    const result =
      await model.generateContent([
        `
Extract product details from this invoice image.

Return ONLY valid raw JSON.

{
  "name": "",
  "brand": "",
  "purchaseDate": "",
  "warrantyPeriod": ""
}

Rules:
- purchaseDate must be YYYY-MM-DD
- warrantyPeriod must be number only in months
- no markdown
- no explanation
- no backticks
`,
        {
          inlineData: {
            mimeType: "image/png",
            data: base64Image,
          },
        },
      ]);

    const response =
      await result.response;

    const text =
      response.text();

    console.log(
      "RAW GEMINI:",
      text
    );

    const cleaned =
      text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

    const parsed =
      JSON.parse(cleaned);

    return NextResponse.json({
      success: true,
      result: parsed,
    });
  } catch (error) {
    console.error(
      "OCR ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "OCR failed",
      },
      {
        status: 500,
      }
    );
  }
}

async function imageUrlToBase64(
  url: string
) {
  const response =
    await fetch(url);

  const arrayBuffer =
    await response.arrayBuffer();

  return Buffer.from(
    arrayBuffer
  ).toString("base64");
}