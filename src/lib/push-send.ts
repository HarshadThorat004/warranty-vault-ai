import webpush from "web-push";

import {
  getVapidPrivateKey,
  getVapidPublicKey,
  getVapidSubject,
  isPushConfigured,
  reminderPushPayload,
} from "@/lib/push";
import { prisma } from "@/lib/prisma";
import type { ReminderType } from "@/lib/reminders";

function configureWebPush() {
  if (!isPushConfigured()) return false;
  webpush.setVapidDetails(
    getVapidSubject(),
    getVapidPublicKey(),
    getVapidPrivateKey()
  );
  return true;
}

export async function sendReminderPushes(input: {
  userId: string;
  productId: string;
  productName: string;
  type: ReminderType;
  coverLabel: string;
}) {
  if (!configureWebPush()) {
    return { sent: 0, skipped: true as const };
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId: input.userId },
  });

  if (subscriptions.length === 0) {
    return { sent: 0, skipped: true as const };
  }

  const payload = JSON.stringify(
    reminderPushPayload({
      type: input.type,
      productName: input.productName,
      productId: input.productId,
      coverLabel: input.coverLabel,
    })
  );

  let sent = 0;

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          payload
        );
        sent += 1;
      } catch (error) {
        const status =
          error && typeof error === "object" && "statusCode" in error
            ? Number((error as { statusCode?: number }).statusCode)
            : 0;

        if (status === 404 || status === 410) {
          await prisma.pushSubscription.delete({
            where: { id: subscription.id },
          }).catch(() => undefined);
          return;
        }

        console.error("PUSH_SEND_ERROR", error);
      }
    })
  );

  return { sent, skipped: false as const };
}
