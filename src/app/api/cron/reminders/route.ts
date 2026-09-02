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
import { reminderRecipients } from "@/lib/household";
import { sendReminderPushes } from "@/lib/push-send";
import { isPushConfigured } from "@/lib/push";
import {
  getReminderHits,
  getReminderWindowDates,
  type ReminderType,
} from "@/lib/reminders";

const BATCH_SIZE = 100;

async function hasEmailNotification(params: {
  userId: string;
  productId: string;
  type: ReminderType;
  periodKey: string;
}) {
  const existing = await prisma.notificationLog.findFirst({
    where: {
      userId: params.userId,
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
    let pushesSent = 0;
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
              extendedExpiry: {
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
          household: {
            select: {
              members: {
                select: {
                  user: {
                    select: {
                      id: true,
                      email: true,
                      name: true,
                    },
                  },
                },
              },
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

        const hits = getReminderHits(product);
        const recipients = reminderRecipients(
          product.user,
          product.household?.members.map((member) => member.user)
        );

        for (const hit of hits) {
          if (quotaStopped) {
            break;
          }

          const { type, periodKey } = hit;

          for (const recipient of recipients) {
            inAppData.push({
              userId: recipient.id,
              productId: product.id,
              type,
              channel: "in_app",
              periodKey,
            });

            if (isPushConfigured()) {
              const alreadyPushed = await prisma.notificationLog.findFirst({
                where: {
                  userId: recipient.id,
                  productId: product.id,
                  type,
                  channel: "push",
                  periodKey,
                },
                select: { id: true },
              });

              if (!alreadyPushed) {
                const pushResult = await sendReminderPushes({
                  userId: recipient.id,
                  productId: product.id,
                  productName: product.name,
                  type,
                  coverLabel: hit.coverLabel,
                });

                if (pushResult.sent > 0) {
                  await prisma.notificationLog.create({
                    data: {
                      userId: recipient.id,
                      productId: product.id,
                      type,
                      channel: "push",
                      periodKey,
                    },
                  }).catch(() => undefined);
                  pushesSent += pushResult.sent;
                }
              }
            }

            const alreadySent = await hasEmailNotification({
              userId: recipient.id,
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
                to: recipient.email,
                userName: recipient.name,
                productName: product.name,
                brand: product.brand,
                type,
                expiryDate: hit.expiry,
                renewalNotes: product.renewalNotes,
                coverLabel: hit.coverLabel,
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
                userId: recipient.id,
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
      pushesSent,
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
