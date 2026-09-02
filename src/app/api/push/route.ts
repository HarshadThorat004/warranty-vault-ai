import { z } from "zod";

import { jsonError, jsonSuccess } from "@/lib/api";
import { getSessionUser } from "@/lib/product-access";
import { prisma } from "@/lib/prisma";
import { getVapidPublicKey, isPushConfigured } from "@/lib/push";

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  if (!isPushConfigured()) {
    return jsonSuccess({ enabled: false, publicKey: null, subscribed: false });
  }

  const existing = await prisma.pushSubscription.findFirst({
    where: { userId: user.id },
    select: { id: true },
  });

  return jsonSuccess({
    enabled: true,
    publicKey: getVapidPublicKey(),
    subscribed: Boolean(existing),
  });
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return jsonError("Unauthorized", 401);
    }

    if (!isPushConfigured()) {
      return jsonError("Push is not configured", 503);
    }

    const parsed = subscribeSchema.safeParse(await req.json());

    if (!parsed.success) {
      return jsonError("Invalid subscription", 400);
    }

    await prisma.pushSubscription.upsert({
      where: { endpoint: parsed.data.endpoint },
      create: {
        userId: user.id,
        endpoint: parsed.data.endpoint,
        p256dh: parsed.data.keys.p256dh,
        auth: parsed.data.keys.auth,
      },
      update: {
        userId: user.id,
        p256dh: parsed.data.keys.p256dh,
        auth: parsed.data.keys.auth,
      },
    });

    return jsonSuccess({ success: true });
  } catch (error) {
    console.error("PUSH_SUBSCRIBE_ERROR", error);
    return jsonError("Failed to save subscription");
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return jsonError("Unauthorized", 401);
    }

    const body = await req.json().catch(() => ({}));
    const endpoint =
      typeof body.endpoint === "string" ? body.endpoint : undefined;

    await prisma.pushSubscription.deleteMany({
      where: endpoint
        ? { userId: user.id, endpoint }
        : { userId: user.id },
    });

    return jsonSuccess({ success: true });
  } catch (error) {
    console.error("PUSH_UNSUBSCRIBE_ERROR", error);
    return jsonError("Failed to remove subscription");
  }
}
