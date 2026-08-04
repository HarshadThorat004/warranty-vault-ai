import { createWorker, PSM } from "tesseract.js";
import sharp from "sharp";

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
  const pdfParse = (await import("pdf-parse")).default;
  const parsed = await pdfParse(buffer);
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

async function extractImageText(buffer: Buffer) {
  const processed = await preprocessImage(buffer);
  const worker = await createWorker("eng", 1, {
    logger: () => undefined,
  });

  try {
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
      preserve_interword_spaces: "1",
    });

    const {
      data: { text },
    } = await worker.recognize(processed);

    return text.trim();
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
