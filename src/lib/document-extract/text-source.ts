import { PSM, type Worker as TesseractWorker } from "tesseract.js";
import sharp from "sharp";

import { createOcrWorker } from "@/lib/document-extract/ocr-langs";

const MAX_DOCUMENT_BYTES = 8 * 1024 * 1024;

export function detectMimeType(url: string, contentType?: string | null) {
  if (contentType === "application/pdf") {
    return "application/pdf";
  }

  if (contentType?.startsWith("image/")) {
    return contentType;
  }

  const lower = url.toLowerCase();

  if (lower.includes(".pdf")) {
    return "application/pdf";
  }

  if (lower.includes(".jpg") || lower.includes(".jpeg")) {
    return "image/jpeg";
  }

  if (lower.includes(".webp")) {
    return "image/webp";
  }

  if (lower.includes(".png")) {
    return "image/png";
  }

  return "image/png";
}

export async function fetchDocumentBuffer(url: string) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch document for scanning");
  }

  const contentType = response.headers.get("content-type");
  const contentLength = Number(response.headers.get("content-length") ?? "0");

  if (contentLength > MAX_DOCUMENT_BYTES) {
    throw new Error("Document is too large for scanning");
  }

  const arrayBuffer = await response.arrayBuffer();

  if (arrayBuffer.byteLength > MAX_DOCUMENT_BYTES) {
    throw new Error("Document is too large for scanning");
  }

  return {
    buffer: Buffer.from(arrayBuffer),
    mimeType: detectMimeType(url, contentType),
  };
}

async function extractPdfText(buffer: Buffer) {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  const parsed = await parser.getText();
  return (parsed.text ?? "").trim();
}

async function preprocessImage(buffer: Buffer) {
  const image = sharp(buffer).rotate();
  const meta = await image.metadata();
  const width = meta.width ?? 0;

  // Upscale small phone photos for better OCR; keep large ones manageable
  const resized =
    width > 0 && width < 1400
      ? image.resize({ width: 1800, withoutEnlargement: false })
      : width > 2800
        ? image.resize({ width: 2200 })
        : image;

  return resized
    .grayscale()
    .normalize()
    .linear(1.15, -8)
    .sharpen({ sigma: 1 })
    .png()
    .toBuffer();
}

async function recognizeWithPsm(
  worker: TesseractWorker,
  image: Buffer,
  psm: typeof PSM.AUTO | typeof PSM.SPARSE_TEXT
) {
  await worker.setParameters({
    tessedit_pageseg_mode: psm,
    preserve_interword_spaces: "1",
  });

  const { data } = await worker.recognize(image);

  return {
    text: (data.text ?? "").trim(),
    confidence: data.confidence ?? 0,
  };
}

async function extractImageText(buffer: Buffer) {
  const processed = await preprocessImage(buffer);
  const worker = await createOcrWorker();

  try {
    const auto = await recognizeWithPsm(worker, processed, PSM.AUTO);

    if (auto.confidence >= 55 && auto.text.length >= 20) {
      return auto.text;
    }

    const sparse = await recognizeWithPsm(worker, processed, PSM.SPARSE_TEXT);

    if (
      sparse.confidence > auto.confidence ||
      sparse.text.length > auto.text.length
    ) {
      return sparse.text;
    }

    return auto.text;
  } finally {
    await worker.terminate();
  }
}

export async function extractTextFromDocument(buffer: Buffer, mimeType: string) {
  if (mimeType === "application/pdf") {
    return extractPdfText(buffer);
  }

  return extractImageText(buffer);
}
