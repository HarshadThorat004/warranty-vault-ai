import { NextRequest, NextResponse } from "next/server";
import { addDays, startOfDay } from "date-fns";

import { prisma } from "@/lib/prisma";
import { sendReminderEmail } from "@/lib/email";
import {
  CRITICAL_EXPIRING_DAYS,
  EXPIRING_SOON_DAYS,
} from "@/constants/warranty";

type ReminderType =
  | "expiring_30"
  | "expiring_7"
  | "expired"
  | "renewal_available";

async function createNotification(params: {
  userId: string;
  productId: string;
  type: ReminderType;
  channel: "email" | "in_app";
}) {
  try {
    await prisma.notificationLog.create({
      data: params,
    });
    return true;
  } catch {
    // Unique constraint — already sent
    return false;
  }
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = startOfDay(new Date());
    const in7 = addDays(today, CRITICAL_EXPIRING_DAYS);
    const in30 = addDays(today, EXPIRING_SOON_DAYS);

    const products = await prisma.product.findMany({
      where: {
        warrantyExpiry: {
          not: null,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    let emailsSent = 0;
    let inAppCreated = 0;
    let skipped = 0;

    for (const product of products) {
      if (!product.warrantyExpiry) continue;

      const expiry = startOfDay(new Date(product.warrantyExpiry));
      const types: ReminderType[] = [];

      if (expiry.getTime() === today.getTime() || expiry < today) {
        types.push("expired");
      } else if (expiry.getTime() === in7.getTime() || (expiry > today && expiry <= in7)) {
        // Critical window: within 7 days (and not already expired)
        if (expiry <= in7) {
          types.push("expiring_7");
        }
      } else if (expiry <= in30) {
        types.push("expiring_30");
      }

      if (product.renewalAvailable) {
        types.push("renewal_available");
      }

      // Prefer the most urgent expiry type only (avoid both 30 and 7)
      const expiryTypes = types.filter((t) =>
        t === "expired" || t === "expiring_7" || t === "expiring_30"
      );
      const orderedExpiry: ReminderType[] = [];
      if (expiryTypes.includes("expired")) orderedExpiry.push("expired");
      else if (expiryTypes.includes("expiring_7")) orderedExpiry.push("expiring_7");
      else if (expiryTypes.includes("expiring_30")) orderedExpiry.push("expiring_30");

      const finalTypes: ReminderType[] = [
        ...orderedExpiry,
        ...(types.includes("renewal_available") ? (["renewal_available"] as const) : []),
      ];

      for (const type of finalTypes) {
        const createdInApp = await createNotification({
          userId: product.userId,
          productId: product.id,
          type,
          channel: "in_app",
        });

        if (createdInApp) {
          inAppCreated += 1;
        } else {
          skipped += 1;
        }

        const createdEmail = await createNotification({
          userId: product.userId,
          productId: product.id,
          type,
          channel: "email",
        });

        if (createdEmail) {
          const result = await sendReminderEmail({
            to: product.user.email,
            userName: product.user.name,
            productName: product.name,
            brand: product.brand,
            type,
            expiryDate: product.warrantyExpiry,
            renewalNotes: product.renewalNotes,
          });

          if (!result.skipped) {
            emailsSent += 1;
          }
        } else {
          skipped += 1;
        }
      }
    }

    return NextResponse.json({
      success: true,
      processed: products.length,
      emailsSent,
      inAppCreated,
      skipped,
    });
  } catch (error) {
    console.error("CRON_REMINDERS_ERROR", error);
    return NextResponse.json(
      { error: "Failed to process reminders" },
      { status: 500 }
    );
  }
}
