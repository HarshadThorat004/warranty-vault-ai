import { jsonError, jsonSuccess } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/product-access";

export async function GET() {
  try {
    const user = await getSessionUser();

    if (!user) {
      return jsonError("Unauthorized", 401);
    }

    const notifications = await prisma.notificationLog.findMany({
      where: {
        userId: user.id,
        channel: "in_app",
        dismissedAt: null,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            brand: true,
            warrantyExpiry: true,
          },
        },
      },
      orderBy: {
        sentAt: "desc",
      },
      take: 50,
    });

    return jsonSuccess({ notifications });
  } catch (error) {
    console.error("NOTIFICATIONS_GET_ERROR", error);
    return jsonError("Failed to load notifications");
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return jsonError("Unauthorized", 401);
    }

    const body = await req.json();

    if (body.markAll) {
      await prisma.notificationLog.updateMany({
        where: {
          userId: user.id,
          channel: "in_app",
          readAt: null,
        },
        data: {
          readAt: new Date(),
        },
      });

      return jsonSuccess({ success: true });
    }

    if (!body.id || typeof body.id !== "string") {
      return jsonError("Notification id is required", 400);
    }

    const existing = await prisma.notificationLog.findFirst({
      where: {
        id: body.id,
        userId: user.id,
      },
    });

    if (!existing) {
      return jsonError("Notification not found", 404);
    }

    await prisma.notificationLog.update({
      where: { id: body.id },
      data: { readAt: new Date() },
    });

    return jsonSuccess({ success: true });
  } catch (error) {
    console.error("NOTIFICATIONS_PATCH_ERROR", error);
    return jsonError("Failed to update notification");
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return jsonError("Unauthorized", 401);
    }

    const body = await req.json().catch(() => ({}));

    if (body.deleteAll) {
      await prisma.notificationLog.updateMany({
        where: {
          userId: user.id,
          channel: "in_app",
          dismissedAt: null,
        },
        data: {
          dismissedAt: new Date(),
          readAt: new Date(),
        },
      });

      return jsonSuccess({ success: true });
    }

    if (!body.id || typeof body.id !== "string") {
      return jsonError("Notification id is required", 400);
    }

    const existing = await prisma.notificationLog.findFirst({
      where: {
        id: body.id,
        userId: user.id,
        channel: "in_app",
      },
    });

    if (!existing) {
      return jsonError("Notification not found", 404);
    }

    await prisma.notificationLog.update({
      where: { id: body.id },
      data: {
        dismissedAt: new Date(),
        readAt: existing.readAt ?? new Date(),
      },
    });

    return jsonSuccess({ success: true });
  } catch (error) {
    console.error("NOTIFICATIONS_DELETE_ERROR", error);
    return jsonError("Failed to delete notification");
  }
}
