import {
  addDays,
  startOfDay,
} from "date-fns";

import { prisma } from "@/lib/prisma";
import {
  CRITICAL_EXPIRING_DAYS,
  EXPIRING_SOON_DAYS,
} from "@/constants/warranty";

type ReminderType =
  | "expiring_30"
  | "expiring_7"
  | "expired"
  | "renewal_available";

export async function syncInAppNotifications(userId: string) {
  const today = startOfDay(new Date());
  const in7 = addDays(today, CRITICAL_EXPIRING_DAYS);
  const in30 = addDays(today, EXPIRING_SOON_DAYS);

  const products = await prisma.product.findMany({
    where: { userId },
  });

  for (const product of products) {
    const types: ReminderType[] = [];

    if (product.warrantyExpiry) {
      const expiry = startOfDay(new Date(product.warrantyExpiry));

      if (expiry <= today) {
        types.push("expired");
      } else if (expiry <= in7) {
        types.push("expiring_7");
      } else if (expiry <= in30) {
        types.push("expiring_30");
      }
    }

    if (product.renewalAvailable) {
      types.push("renewal_available");
    }

    for (const type of types) {
      try {
        await prisma.notificationLog.create({
          data: {
            userId,
            productId: product.id,
            type,
            channel: "in_app",
          },
        });
      } catch {
        // already exists
      }
    }
  }
}
