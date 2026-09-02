import { Resend } from "resend";

import { consumeRateLimit } from "@/lib/rate-limit";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const DEFAULT_FROM = "Warranty Vault <noreply@warrantyvault.in>";
const DEFAULT_REPLY_TO = "warrantyvault.in@gmail.com";
const DEFAULT_DOMAIN_FROM = "Warranty Vault <noreply@warrantyvault.in>";

/** Resend free tier is 100/day — keep a small buffer for OTP + tests. */
export const RESEND_FREE_DAILY_LIMIT = 95;

export type EmailErrorKind =
  | "quota"
  | "domain"
  | "test_recipient"
  | "config"
  | "unknown";

export class EmailSendError extends Error {
  kind: EmailErrorKind;
  statusCode?: number;
  code?: string;

  constructor(
    message: string,
    kind: EmailErrorKind = "unknown",
    extras?: { statusCode?: number; code?: string }
  ) {
    super(message);
    this.name = "EmailSendError";
    this.kind = kind;
    this.statusCode = extras?.statusCode;
    this.code = extras?.code;
  }
}

type ReminderEmailInput = {
  to: string;
  userName: string | null;
  productName: string;
  brand: string | null;
  type: string;
  expiryDate: Date | null;
  renewalNotes?: string | null;
  coverLabel?: string | null;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function reminderSubject(type: string, coverLabel?: string | null) {
  const cover = coverLabel || "Warranty";
  const subjects: Record<string, string> = {
    expiring_30: `${cover} reminder: expires in 30 days`,
    expiring_7: `Urgent: ${cover.toLowerCase()} expires in 7 days`,
    expiring_1: `${cover} expires tomorrow`,
    expired: `${cover} has expired`,
    renewal_available: "Warranty renewal available",
  };
  return subjects[type] ?? "Warranty reminder";
}

function getFrom() {
  return process.env.RESEND_FROM_EMAIL || DEFAULT_FROM;
}

function getReplyTo() {
  return process.env.RESEND_REPLY_TO || DEFAULT_REPLY_TO;
}

export function isUsingSharedTestSender() {
  const from = getFrom().toLowerCase();
  return from.includes("onboarding@resend.dev") || from.includes("@resend.dev");
}

export function getResendTestRecipient() {
  return (
    process.env.RESEND_TEST_RECIPIENT ||
    process.env.RESEND_REPLY_TO ||
    ""
  )
    .trim()
    .toLowerCase();
}

export function getEmailProviderStatus() {
  const configured = Boolean(process.env.RESEND_API_KEY);
  const usingSharedSender = isUsingSharedTestSender();
  const domainReady = configured && !usingSharedSender;

  return {
    configured,
    usingSharedSender,
    domainReady,
    from: getFrom(),
    replyTo: getReplyTo(),
    recommendedFrom: DEFAULT_DOMAIN_FROM,
    dailyLimit: RESEND_FREE_DAILY_LIMIT,
    testRecipient: getResendTestRecipient() || null,
  };
}

function utcDayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function reserveDailyEmailSlot() {
  const limit = Number(process.env.RESEND_DAILY_LIMIT || RESEND_FREE_DAILY_LIMIT);
  const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : RESEND_FREE_DAILY_LIMIT;

  return consumeRateLimit({
    key: `resend:daily:${utcDayKey()}`,
    limit: safeLimit,
    windowMs: 24 * 60 * 60 * 1000,
  });
}

export function classifyResendError(error: unknown): EmailErrorKind {
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error ?? "").toLowerCase();

  if (
    message.includes("too many requests") ||
    message.includes("rate limit") ||
    message.includes("quota") ||
    message.includes("daily") ||
    message.includes("monthly")
  ) {
    return "quota";
  }

  if (
    message.includes("only send testing emails") ||
    message.includes("own email address") ||
    message.includes("please use our testing email address") ||
    message.includes("invalid `to` field") ||
    message.includes("invalid 'to' field")
  ) {
    return "test_recipient";
  }

  if (
    message.includes("verify a domain") ||
    message.includes("domain is not verified") ||
    message.includes("from domain") ||
    message.includes("not authorized to send")
  ) {
    return "domain";
  }

  return "unknown";
}

export function isResendTestRecipientRestriction(error: unknown) {
  return classifyResendError(error) === "test_recipient";
}

export function isResendQuotaError(error: unknown) {
  return classifyResendError(error) === "quota";
}

export function friendlyEmailError(error: unknown) {
  if (error instanceof EmailSendError) {
    if (error.kind === "quota") {
      return "Email daily limit reached (Resend free tier ~100/day). Try again tomorrow.";
    }
    if (error.kind === "domain") {
      return "Email domain is not verified in Resend yet. Verify warrantyvault.in and set RESEND_FROM_EMAIL to noreply@warrantyvault.in.";
    }
    if (error.kind === "test_recipient") {
      const allowed = getResendTestRecipient();
      return allowed
        ? `Until your domain is verified, emails can only be sent to ${allowed}.`
        : "Until your domain is verified, Resend can only email your account owner address.";
    }
    if (error.kind === "config") {
      return "Email is not configured. Set RESEND_API_KEY.";
    }
    return error.message;
  }

  const kind = classifyResendError(error);
  if (kind === "quota") {
    return "Email daily limit reached (Resend free tier ~100/day). Try again tomorrow.";
  }
  if (kind === "domain") {
    return "Email domain is not verified in Resend yet. Verify warrantyvault.in and set RESEND_FROM_EMAIL to noreply@warrantyvault.in.";
  }
  if (kind === "test_recipient") {
    const allowed = getResendTestRecipient();
    return allowed
      ? `Until your domain is verified, emails can only be sent to ${allowed}.`
      : "Until your domain is verified, Resend can only email your account owner address.";
  }

  return error instanceof Error && error.message
    ? error.message
    : "Failed to send email";
}

function buildBody(input: ReminderEmailInput) {
  const name = input.userName || "there";
  const brand = input.brand ? ` (${input.brand})` : "";
  const expiry = input.expiryDate
    ? input.expiryDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";

  const cover = input.coverLabel || "warranty";
  const messages: Record<string, string> = {
    expiring_30: `Your ${cover.toLowerCase()} for <strong>${input.productName}${brand}</strong> expires on <strong>${expiry}</strong> (within 30 days).`,
    expiring_7: `Urgent: your ${cover.toLowerCase()} for <strong>${input.productName}${brand}</strong> expires on <strong>${expiry}</strong> (within 7 days).`,
    expiring_1: `Your ${cover.toLowerCase()} for <strong>${input.productName}${brand}</strong> expires tomorrow (<strong>${expiry}</strong>).`,
    expired: `Your ${cover.toLowerCase()} for <strong>${input.productName}${brand}</strong> expired on <strong>${expiry}</strong>.`,
    renewal_available: `A renewal option is available for <strong>${input.productName}${brand}</strong>.${
      input.renewalNotes ? ` Notes: ${input.renewalNotes}` : ""
    }`,
  };

  return `
    <div style="font-family: Inter, system-ui, sans-serif; color: #111; line-height: 1.6;">
      <h2 style="margin-bottom: 8px;">Warranty Vault AI</h2>
      <p>Hi ${name},</p>
      <p>${messages[input.type] ?? "You have a warranty update."}</p>
      <p>Log in to your dashboard to review documents and take action.</p>
      <p style="color:#666;font-size:12px;margin-top:24px;">You received this because you have reminders enabled in Warranty Vault AI.</p>
    </div>
  `;
}

function buildTestBody() {
  return `
    <div style="font-family: Inter, system-ui, sans-serif; color: #111; line-height: 1.6;">
      <h2 style="margin-bottom: 8px;">Warranty Vault AI</h2>
      <p>Hi there,</p>
      <p>This is a test email from <strong>Warranty Vault</strong>. Reminder delivery is working.</p>
      <p>If you reply to this message, it will go to our support inbox.</p>
      <p style="color:#666;font-size:12px;margin-top:24px;">You can ignore this message if you received it during setup.</p>
    </div>
  `;
}

async function sendViaResend(params: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!resend) {
    throw new EmailSendError(
      "RESEND_API_KEY is not configured",
      "config"
    );
  }

  const quota = reserveDailyEmailSlot();
  if (!quota.success) {
    throw new EmailSendError(
      "Resend free daily email limit reached",
      "quota",
      { statusCode: 429 }
    );
  }

  const result = await resend.emails.send({
    from: getFrom(),
    replyTo: getReplyTo(),
    to: params.to,
    subject: params.subject,
    html: params.html,
  });

  if (result.error) {
    const message = result.error.message || "Failed to send email";
    const kind = classifyResendError(message);
    throw new EmailSendError(message, kind, {
      code: result.error.name,
      statusCode:
        typeof (result.error as { statusCode?: number }).statusCode === "number"
          ? (result.error as { statusCode?: number }).statusCode
          : undefined,
    });
  }

  return {
    id: result.data?.id ?? null,
  };
}

export async function sendReminderEmail(input: ReminderEmailInput) {
  if (!resend) {
    console.warn("RESEND_API_KEY missing — skipping email send");
    return { skipped: true as const, reason: "config" as const };
  }

  try {
    await sendViaResend({
      to: input.to,
      subject: reminderSubject(input.type, input.coverLabel),
      html: buildBody(input),
    });
    return { skipped: false as const };
  } catch (error) {
    if (error instanceof EmailSendError && error.kind === "quota") {
      return { skipped: true as const, reason: "quota" as const };
    }
    throw error;
  }
}

export async function sendTestEmail(to: string) {
  if (!resend) {
    console.warn("RESEND_API_KEY missing — skipping email send");
    return { skipped: true as const, id: null, reason: "config" as const };
  }

  const result = await sendViaResend({
    to,
    subject: "Warranty Vault — test email",
    html: buildTestBody(),
  });

  return { skipped: false as const, id: result.id };
}

export async function sendOtpEmail(to: string, code: string) {
  if (!resend) {
    console.warn("RESEND_API_KEY missing — skipping OTP email");
    return { skipped: true as const, reason: "config" as const };
  }

  await sendViaResend({
    to,
    subject: "Your Warranty Vault sign-in code",
    html: `
      <div style="font-family: Inter, system-ui, sans-serif; color: #111; line-height: 1.6;">
        <h2 style="margin-bottom: 8px;">Warranty Vault AI</h2>
        <p>Use this one-time code to sign in:</p>
        <p style="font-size: 28px; letter-spacing: 6px; font-weight: 700; margin: 20px 0;">${code}</p>
        <p>This code expires in 10 minutes. If you did not request it, you can ignore this email.</p>
      </div>
    `,
  });

  return { skipped: false as const };
}

export async function sendHouseholdInviteEmail(input: {
  to: string;
  inviterName: string | null;
  inviterEmail: string;
  householdName: string;
  acceptUrl: string;
}) {
  if (!resend) {
    console.warn("RESEND_API_KEY missing — skipping household invite email");
    return { skipped: true as const, reason: "config" as const };
  }

  const who = escapeHtml(input.inviterName?.trim() || input.inviterEmail);
  const vaultName = escapeHtml(input.householdName);

  await sendViaResend({
    to: input.to,
    subject: `${input.inviterName?.trim() || input.inviterEmail} invited you to a shared Warranty Vault`,
    html: `
      <div style="font-family: Inter, system-ui, sans-serif; color: #111; line-height: 1.6;">
        <h2 style="margin-bottom: 8px;">Warranty Vault AI</h2>
        <p>${who} invited you to share <strong>${vaultName}</strong> — one vault for household invoices, warranties, and expiry reminders.</p>
        <p style="margin: 24px 0;">
          <a href="${input.acceptUrl}" style="display: inline-block; background: #111; color: #fff; text-decoration: none; padding: 12px 18px; border-radius: 10px; font-weight: 600;">
            Join the vault
          </a>
        </p>
        <p>This invite expires in 7 days. If you did not expect this, you can ignore the email.</p>
      </div>
    `,
  });

  return { skipped: false as const };
}
