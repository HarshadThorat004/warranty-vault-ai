import { NextRequest } from "next/server";

import { jsonError, jsonSuccess } from "@/lib/api";
import {
  EmailSendError,
  friendlyEmailError,
  getEmailProviderStatus,
  sendTestEmail,
} from "@/lib/email";

const DEFAULT_TEST_TO = "warrantyvault.in@gmail.com";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return jsonError("Unauthorized", 401);
    }

    let to = DEFAULT_TEST_TO;

    try {
      const body = (await req.json()) as { to?: string };
      if (body?.to && typeof body.to === "string" && body.to.includes("@")) {
        to = body.to.trim();
      }
    } catch {
      // Empty body is fine — use default recipient
    }

    const status = getEmailProviderStatus();
    const result = await sendTestEmail(to);

    if (result.skipped) {
      return jsonError("RESEND_API_KEY is not configured", 503, {
        code: "resend_config",
      });
    }

    return jsonSuccess({
      success: true,
      to,
      id: result.id,
      emailSetup: {
        domainReady: status.domainReady,
        usingSharedSender: status.usingSharedSender,
        from: status.from,
        recommendedFrom: status.recommendedFrom,
      },
    });
  } catch (error) {
    console.error("TEST_EMAIL_ERROR", error);

    if (error instanceof EmailSendError) {
      const status =
        error.kind === "quota"
          ? 429
          : error.kind === "domain" || error.kind === "test_recipient"
            ? 403
            : 500;
      return jsonError(friendlyEmailError(error), status, {
        code: `resend_${error.kind}`,
      });
    }

    return jsonError(friendlyEmailError(error));
  }
}
