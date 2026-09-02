import type { ReminderType } from "@/lib/reminders";

export function getVapidPublicKey() {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() || "";
}

export function getVapidPrivateKey() {
  return process.env.VAPID_PRIVATE_KEY?.trim() || "";
}

export function getVapidSubject() {
  return (
    process.env.VAPID_SUBJECT?.trim() || "mailto:warrantyvault.in@gmail.com"
  );
}

export function isPushConfigured() {
  return Boolean(getVapidPublicKey() && getVapidPrivateKey());
}

export function reminderPushPayload(input: {
  type: ReminderType | string;
  productName: string;
  productId: string;
  coverLabel?: string | null;
}) {
  const cover = input.coverLabel || "Warranty";
  const titles: Record<string, string> = {
    expiring_30: `${cover} expires in 30 days`,
    expiring_7: `${cover} expires in 7 days`,
    expiring_1: `${cover} expires tomorrow`,
    expired: `${cover} has expired`,
    renewal_available: "Warranty renewal available",
  };

  return {
    title: titles[input.type] ?? "Warranty reminder",
    body: input.productName,
    url: `/dashboard/products/${input.productId}`,
  };
}
