import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  getReminderPeriodKey,
  getReminderTypes,
  getReminderWindowDates,
} from "@/lib/reminders";

export async function syncInAppNotifications(userId: string) {
  const { in30 } = getReminderWindowDates();

  const products = await prisma.product.findMany({
    where: {
      userId,
      OR: [
        {
          warrantyExpiry: {
            lte: in30,
          },
        },
        {
          renewalAvailable: true,
        },
      ],
    },
    select: {
      id: true,
      userId: true,
      warrantyExpiry: true,
      renewalAvailable: true,
    },
  });

  const data: Prisma.NotificationLogCreateManyInput[] = [];

  for (const product of products) {
    const types = getReminderTypes(product);

    for (const type of types) {
      data.push({
        userId,
        productId: product.id,
        type,
        channel: "in_app",
        periodKey: getReminderPeriodKey(type, product.warrantyExpiry),
      });
    }
  }

  if (data.length === 0) {
    return { created: 0 };
  }

  const result = await prisma.notificationLog.createMany({
    data,
    skipDuplicates: true,
  });

  return { created: result.count };
}
