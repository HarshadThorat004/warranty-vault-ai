import { z } from "zod";

import { getRequestIp, jsonError, jsonSuccess } from "@/lib/api";
import { createEmailOtp, normalizeEmail } from "@/lib/auth-helpers";
import {
  EmailSendError,
  friendlyEmailError,
  getEmailProviderStatus,
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
    const status = getEmailProviderStatus();

    const rateLimit = consumeRateLimit({
      key: `auth:otp-send:${requestIp}:${email}`,
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });

    if (!rateLimit.success) {
      return jsonError("Too many codes requested. Please try again later.", 429);
    }

    if (!status.configured) {
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
        domainReady: status.domainReady,
      });
    } catch (sendError) {
      // Shared Resend test sender can only email the account owner.
      // In development, keep OTP and return the code so login still works.
      if (isResendTestRecipientRestriction(sendError)) {
        const allowed = getResendTestRecipient();

        if (process.env.NODE_ENV !== "production") {
          console.warn(
            `[OTP DEV] Resend free-tier recipient limit. Code for ${otp.email}: ${otp.code}`
          );

          return jsonSuccess({
            success: true,
            message:
              allowed && otp.email !== allowed
                ? `Resend free tier can only email ${allowed} until your domain is verified. Dev code shown below.`
                : "Email delivery limited until domain verification. Use the code shown below.",
            expiresInMinutes: 10,
            devCode: otp.code,
            allowedRecipient: allowed || null,
            domainReady: false,
          });
        }

        await prisma.emailOtp.deleteMany({ where: { email: otp.email } });
        return jsonError(friendlyEmailError(sendError), 403, {
          code: "resend_test_recipient",
        });
      }

      if (sendError instanceof EmailSendError && sendError.kind === "quota") {
        await prisma.emailOtp.deleteMany({ where: { email: otp.email } });
        return jsonError(friendlyEmailError(sendError), 429, {
          code: "resend_quota",
        });
      }

      if (sendError instanceof EmailSendError && sendError.kind === "domain") {
        await prisma.emailOtp.deleteMany({ where: { email: otp.email } });
        return jsonError(friendlyEmailError(sendError), 503, {
          code: "resend_domain",
        });
      }

      throw sendError;
    }
  } catch (error) {
    console.error("OTP_SEND_ERROR", error);

    if (createdEmail) {
      await prisma.emailOtp
        .deleteMany({ where: { email: createdEmail } })
        .catch(() => undefined);
    }

    return jsonError(friendlyEmailError(error), 500);
  }
}
