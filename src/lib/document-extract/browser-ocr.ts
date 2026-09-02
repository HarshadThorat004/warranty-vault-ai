import jsQR from "jsqr";
import { PSM } from "tesseract.js";

import { createOcrWorker } from "@/lib/document-extract/ocr-langs";

const MAX_OCR_EDGE = 1800;

export type BrowserOcrResult = {
  text: string;
  qrPayload: string | null;
};

export async function recognizeDocumentImage(
  file: File,
  onStatus?: (message: string) => void
): Promise<BrowserOcrResult> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  const scale = Math.min(1, MAX_OCR_EDGE / Math.max(bitmap.width, bitmap.height));
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    bitmap.close();
    throw new Error("Could not read this image");
  }

  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  bitmap.close();

  onStatus?.("Looking for GST QR…");
  const qrPayload = decodeQr(imageData);

  onStatus?.("Reading printed text on this device…");
  const text = await recognizeCanvas(canvas);

  return { text, qrPayload };
}

function decodeQr(imageData: ImageData) {
  const result = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: "attemptBoth",
  });
  return result?.data?.trim() || null;
}

async function recognizeCanvas(canvas: HTMLCanvasElement) {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (value) => (value ? resolve(value) : reject(new Error("Could not prepare image for OCR"))),
      "image/png"
    );
  });

  const worker = await createOcrWorker();

  try {
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.AUTO,
      preserve_interword_spaces: "1",
    });
    const { data } = await worker.recognize(blob);
    return (data.text ?? "").trim();
  } finally {
    await worker.terminate();
  }
}
