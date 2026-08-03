import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/product-access";
import { syncInAppNotifications } from "@/lib/notifications";

export async function GET() {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await syncInAppNotifications(user.id);

    const notifications = await prisma.notificationLog.findMany({
      where: {
        userId: user.id,
        channel: "in_app",
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

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("NOTIFICATIONS_GET_ERROR", error);
    return NextResponse.json(
      { error: "Failed to load notifications" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
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

      return NextResponse.json({ success: true });
    }

    if (!body.id || typeof body.id !== "string") {
      return NextResponse.json(
        { error: "Notification id is required" },
        { status: 400 }
      );
    }

    const existing = await prisma.notificationLog.findFirst({
      where: {
        id: body.id,
        userId: user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    await prisma.notificationLog.update({
      where: { id: body.id },
      data: { readAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("NOTIFICATIONS_PATCH_ERROR", error);
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 }
    );
  }
}
