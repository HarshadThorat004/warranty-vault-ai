import { z } from "zod";

import { getRequestIp, jsonError, jsonSuccess } from "@/lib/api";
import { createEmailOtp, normalizeEmail } from "@/lib/auth-helpers";
import {
  getResendTestRecipient,
  isResendTestRecipientRestriction,
  sendOtpEmail,
} from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit } from "@/lib/rate-limit";

const sendSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(req: Request) {
  let createdEmail: string | null = null;

  try {
    const body = await req.json();
    const parsed = sendSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError("Invalid email address", 400, {
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const email = normalizeEmail(parsed.data.email);
    const requestIp = getRequestIp(req);

    const rateLimit = consumeRateLimit({
      key: `auth:otp-send:${requestIp}:${email}`,
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });

    if (!rateLimit.success) {
      return jsonError("Too many codes requested. Please try again later.", 429);
    }

    if (!process.env.RESEND_API_KEY) {
      return jsonError("Email sign-in is not configured yet", 503);
    }

    const otp = await createEmailOtp(email);
    createdEmail = otp.email;

    try {
      const result = await sendOtpEmail(otp.email, otp.code);

      if (result.skipped) {
        await prisma.emailOtp.deleteMany({ where: { email: otp.email } });
        return jsonError("Email sign-in is not configured yet", 503);
      }

      return jsonSuccess({
        success: true,
        message: "Check your email for a 6-digit code",
        expiresInMinutes: 10,
      });
    } catch (sendError) {
      // Resend free tier (onboarding@resend.dev) can only email the account owner.
      // In local development, still keep the OTP and return the code so login works.
      if (isResendTestRecipientRestriction(sendError)) {
        const allowed = getResendTestRecipient();

        if (process.env.NODE_ENV !== "production") {
          console.warn(
            `[OTP DEV] Resend free-tier limit hit. Code for ${otp.email}: ${otp.code}`
          );

          return jsonSuccess({
            success: true,
            message:
              allowed && otp.email !== allowed
                ? `Resend free tier can only email ${allowed}. Dev code shown below for testing.`
                : "Email delivery limited on Resend free tier. Use the code shown below.",
            expiresInMinutes: 10,
            devCode: otp.code,
            allowedRecipient: allowed || null,
          });
        }

        await prisma.emailOtp.deleteMany({ where: { email: otp.email } });

        return jsonError(
          allowed
            ? `OTP email can currently only be sent to ${allowed}. Verify a domain in Resend to enable any email address.`
            : "OTP email is limited by Resend free tier. Verify a domain in Resend to enable email codes.",
          403
        );
      }

      throw sendError;
    }
  } catch (error) {
    console.error("OTP_SEND_ERROR", error);

    if (createdEmail) {
      await prisma.emailOtp.deleteMany({ where: { email: createdEmail } }).catch(() => undefined);
    }

    const message =
      error instanceof Error && error.message
        ? error.message
        : "Could not send sign-in code";

    return jsonError(message);
  }
}
