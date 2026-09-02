import { jsonError, jsonSuccess } from "@/lib/api";
import {
  SCAN_FAILED_MESSAGE,
  scanDocumentFromText,
  scanDocumentFromUrl,
} from "@/lib/document-extract";
import { getSessionUser } from "@/lib/product-access";
import { consumeRateLimit } from "@/lib/rate-limit";
import { assertAllowedRemoteUrl } from "@/lib/url-allowlist";

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return jsonError("Unauthorized", 401);
    }

    const rateLimit = consumeRateLimit({
      key: `ocr:${user.id}`,
      limit: 20,
      windowMs: 60 * 60 * 1000,
    });

    if (!rateLimit.success) {
      return jsonError("Scan limit reached. Please try again later.", 429);
    }

    const body = await req.json();
    const text = typeof body.text === "string" ? body.text : "";
    const qrPayload = typeof body.qrPayload === "string" ? body.qrPayload : "";
    const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl : "";

    let result;

    if (text.trim()) {
      result = scanDocumentFromText(text, qrPayload || null);
    } else if (imageUrl) {
      assertAllowedRemoteUrl(imageUrl);
      result = await scanDocumentFromUrl(imageUrl);
    } else {
      return jsonError("imageUrl or text is required", 400);
    }

    return jsonSuccess({
      success: true,
      result,
    });
  } catch (error) {
    console.error("OCR ERROR:", error);

    if (error instanceof Error) {
      if (error.message === SCAN_FAILED_MESSAGE) {
        return jsonError(SCAN_FAILED_MESSAGE, 422);
      }

      if (error.message === "Only approved uploaded image URLs are allowed") {
        return jsonError(error.message, 400);
      }

      if (
        error.message === "Document is too large for scanning" ||
        error.message === "Uploaded image is too large for OCR"
      ) {
        return jsonError(error.message, 413);
      }
    }

    return jsonError(SCAN_FAILED_MESSAGE, 422);
  }
}
