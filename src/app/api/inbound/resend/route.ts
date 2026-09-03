import { jsonError, jsonSuccess } from "@/lib/api";
import { ingestReceivedEmail, verifyResendWebhook } from "@/lib/inbound-ingest";
import { consumeRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const limit = consumeRateLimit({
      key: `inbound:resend:${ip}`,
      limit: 60,
      windowMs: 60 * 60 * 1000,
    });

    if (!limit.success) {
      return jsonError("Too many inbound events", 429);
    }

    const rawBody = await req.text();
    const event = verifyResendWebhook(rawBody, req.headers);
    const result = await ingestReceivedEmail(event);

    return jsonSuccess(result);
  } catch (error) {
    console.error("INBOUND_WEBHOOK_ERROR", error);
    const message = error instanceof Error ? error.message : "Invalid webhook";
    const status =
      message.includes("required") || message.includes("verify") ? 401 : 400;
    return jsonError(message, status);
  }
}
