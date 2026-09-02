import { Prisma } from "@prisma/client";

import { getHouseholdIdForUser, vaultProductWhere } from "@/lib/household";
import { prisma } from "@/lib/prisma";
import { getReminderHits, getReminderWindowDates } from "@/lib/reminders";

export async function syncInAppNotifications(userId: string) {
  const { in30 } = getReminderWindowDates();
  const householdId = await getHouseholdIdForUser(userId);

  const products = await prisma.product.findMany({
    where: {
      AND: [
        vaultProductWhere(userId, householdId),
        {
          OR: [
            {
              warrantyExpiry: {
                lte: in30,
              },
            },
            {
              extendedExpiry: {
                lte: in30,
              },
            },
            {
              renewalAvailable: true,
            },
          ],
        },
      ],
    },
    select: {
      id: true,
      userId: true,
      warrantyExpiry: true,
      extendedExpiry: true,
      extendedType: true,
      renewalAvailable: true,
    },
  });

  const data: Prisma.NotificationLogCreateManyInput[] = [];

  for (const product of products) {
    for (const hit of getReminderHits(product)) {
      data.push({
        userId,
        productId: product.id,
        type: hit.type,
        channel: "in_app",
        periodKey: hit.periodKey,
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
