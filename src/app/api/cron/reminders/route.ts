import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";

import { jsonError, jsonSuccess } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import {
  EmailSendError,
  friendlyEmailError,
  getEmailProviderStatus,
  sendReminderEmail,
} from "@/lib/email";
import {
  getReminderPeriodKey,
  getReminderTypes,
  getReminderWindowDates,
  type ReminderType,
} from "@/lib/reminders";

const BATCH_SIZE = 100;

async function hasEmailNotification(params: {
  productId: string;
  type: ReminderType;
  periodKey: string;
}) {
  const existing = await prisma.notificationLog.findFirst({
    where: {
      productId: params.productId,
      type: params.type,
      channel: "email",
      periodKey: params.periodKey,
    },
    select: {
      id: true,
    },
  });

  return Boolean(existing);
}

async function createEmailNotification(params: {
  userId: string;
  productId: string;
  type: ReminderType;
  periodKey: string;
}) {
  try {
    await prisma.notificationLog.create({
      data: {
        ...params,
        channel: "email",
      },
    });
    return true;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return false;
    }

    throw error;
  }
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return jsonError("Unauthorized", 401);
    }

    const { in30 } = getReminderWindowDates();
    const emailStatus = getEmailProviderStatus();
    let cursor: string | undefined;
    let emailsSent = 0;
    let inAppCreated = 0;
    let skipped = 0;
    let processed = 0;
    let quotaStopped = false;
    let emailErrors = 0;
    let lastEmailError: string | null = null;

    for (;;) {
      if (quotaStopped) {
        break;
      }

      const products = await prisma.product.findMany({
        where: {
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
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: {
          id: "asc",
        },
        take: BATCH_SIZE,
        ...(cursor
          ? {
              cursor: { id: cursor },
              skip: 1,
            }
          : {}),
      });

      if (products.length === 0) {
        break;
      }

      processed += products.length;

      const inAppData: Prisma.NotificationLogCreateManyInput[] = [];

      for (const product of products) {
        if (quotaStopped) {
          break;
        }

        const types = getReminderTypes(product);

        for (const type of types) {
          const periodKey = getReminderPeriodKey(type, product.warrantyExpiry);

          inAppData.push({
            userId: product.userId,
            productId: product.id,
            type,
            channel: "in_app",
            periodKey,
          });

          const alreadySent = await hasEmailNotification({
            productId: product.id,
            type,
            periodKey,
          });

          if (alreadySent) {
            skipped += 1;
            continue;
          }

          try {
            const result = await sendReminderEmail({
              to: product.user.email,
              userName: product.user.name,
              productName: product.name,
              brand: product.brand,
              type,
              expiryDate: product.warrantyExpiry,
              renewalNotes: product.renewalNotes,
            });

            if (result.skipped) {
              if (result.reason === "quota") {
                quotaStopped = true;
                lastEmailError = friendlyEmailError(
                  new EmailSendError("quota", "quota")
                );
                break;
              }
              skipped += 1;
              continue;
            }

            const createdEmail = await createEmailNotification({
              userId: product.userId,
              productId: product.id,
              type,
              periodKey,
            });

            if (createdEmail) {
              emailsSent += 1;
            } else {
              skipped += 1;
            }
          } catch (error) {
            emailErrors += 1;
            lastEmailError = friendlyEmailError(error);
            console.error("CRON_REMINDER_EMAIL_ERROR", error);

            if (error instanceof EmailSendError && error.kind === "quota") {
              quotaStopped = true;
              break;
            }
          }
        }
      }

      if (inAppData.length > 0) {
        const result = await prisma.notificationLog.createMany({
          data: inAppData,
          skipDuplicates: true,
        });

        inAppCreated += result.count;
        skipped += inAppData.length - result.count;
      }

      cursor = products.at(-1)?.id;
    }

    return jsonSuccess({
      success: true,
      processed,
      emailsSent,
      inAppCreated,
      skipped,
      quotaStopped,
      emailErrors,
      lastEmailError,
      emailSetup: {
        domainReady: emailStatus.domainReady,
        usingSharedSender: emailStatus.usingSharedSender,
        from: emailStatus.from,
        dailyLimit: emailStatus.dailyLimit,
      },
    });
  } catch (error) {
    console.error("CRON_REMINDERS_ERROR", error);
    return jsonError(friendlyEmailError(error));
  }
}
