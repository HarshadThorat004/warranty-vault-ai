import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

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

export async function sendReminderEmail(input: ReminderEmailInput) {
  if (!resend) {
    console.warn("RESEND_API_KEY missing — skipping email send");
    return { skipped: true as const };
  }

  const from =
    process.env.RESEND_FROM_EMAIL || "Warranty Vault <onboarding@resend.dev>";

  await resend.emails.send({
    from,
    to: input.to,
    subject: SUBJECTS[input.type] ?? "Warranty reminder",
    html: buildBody(input),
  });

  return { skipped: false as const };
}
