import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const DEFAULT_FROM = "Warranty Vault <onboarding@resend.dev>";
const DEFAULT_REPLY_TO = "warrantyvault.in@gmail.com";

type ReminderEmailInput = {
  to: string;
  userName: string | null;
  productName: string;
  brand: string | null;
  type: string;
  expiryDate: Date | null;
  renewalNotes?: string | null;
};

const SUBJECTS: Record<string, string> = {
  expiring_30: "Warranty reminder: expires in 30 days",
  expiring_7: "Urgent: warranty expires in 7 days",
  expired: "Warranty has expired",
  renewal_available: "Warranty renewal available",
};

function getFrom() {
  return process.env.RESEND_FROM_EMAIL || DEFAULT_FROM;
}

function getReplyTo() {
  return process.env.RESEND_REPLY_TO || DEFAULT_REPLY_TO;
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

  const messages: Record<string, string> = {
    expiring_30: `Your warranty for <strong>${input.productName}${brand}</strong> expires on <strong>${expiry}</strong> (within 30 days).`,
    expiring_7: `Urgent: your warranty for <strong>${input.productName}${brand}</strong> expires on <strong>${expiry}</strong> (within 7 days).`,
    expired: `Your warranty for <strong>${input.productName}${brand}</strong> expired on <strong>${expiry}</strong>.`,
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

export async function sendReminderEmail(input: ReminderEmailInput) {
  if (!resend) {
    console.warn("RESEND_API_KEY missing — skipping email send");
    return { skipped: true as const };
  }

  const result = await resend.emails.send({
    from: getFrom(),
    replyTo: getReplyTo(),
    to: input.to,
    subject: SUBJECTS[input.type] ?? "Warranty reminder",
    html: buildBody(input),
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  return { skipped: false as const };
}

export async function sendTestEmail(to: string) {
  if (!resend) {
    console.warn("RESEND_API_KEY missing — skipping email send");
    return { skipped: true as const, id: null };
  }

  const result = await resend.emails.send({
    from: getFrom(),
    replyTo: getReplyTo(),
    to,
    subject: "Warranty Vault — test email",
    html: buildTestBody(),
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  return { skipped: false as const, id: result.data?.id ?? null };
}

export async function sendOtpEmail(to: string, code: string) {
  if (!resend) {
    console.warn("RESEND_API_KEY missing — skipping OTP email");
    return { skipped: true as const };
  }

  const result = await resend.emails.send({
    from: getFrom(),
    replyTo: getReplyTo(),
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

  if (result.error) {
    const message = result.error.message || "Failed to send OTP email";
    const error = new Error(message) as Error & {
      code?: string;
      statusCode?: number;
    };
    error.code = result.error.name;
    error.statusCode =
      typeof (result.error as { statusCode?: number }).statusCode === "number"
        ? (result.error as { statusCode?: number }).statusCode
        : undefined;
    throw error;
  }

  return { skipped: false as const };
}

export function isResendTestRecipientRestriction(error: unknown) {
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error ?? "").toLowerCase();

  return (
    message.includes("only send testing emails") ||
    message.includes("verify a domain") ||
    message.includes("own email address") ||
    message.includes("please use our testing email address") ||
    message.includes("invalid `to` field") ||
    message.includes("invalid 'to' field")
  );
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
