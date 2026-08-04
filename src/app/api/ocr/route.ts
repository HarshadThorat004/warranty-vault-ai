import { jsonError, jsonSuccess } from "@/lib/api";
import {
  SCAN_FAILED_MESSAGE,
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
    const { imageUrl } = body;

    if (!imageUrl || typeof imageUrl !== "string") {
      return jsonError("imageUrl is required", 400);
    }

    assertAllowedRemoteUrl(imageUrl);

    const result = await scanDocumentFromUrl(imageUrl);

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
