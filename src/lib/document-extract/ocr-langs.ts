import { createWorker } from "tesseract.js";

export const OCR_LANGUAGES = "eng+hin";
export const OCR_LANGUAGES_FALLBACK = "eng";

export async function createOcrWorker() {
  try {
    return await createWorker(OCR_LANGUAGES, 1, {
      logger: () => undefined,
    });
  } catch (error) {
    console.warn("OCR_LANGS_HINDI_UNAVAILABLE", error);
    return createWorker(OCR_LANGUAGES_FALLBACK, 1, {
      logger: () => undefined,
    });
  }
}
