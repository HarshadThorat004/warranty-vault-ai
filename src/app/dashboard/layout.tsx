import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import DashboardNavbar from "@/components/dashboard-navbar";
import BackgroundGlow from "@/components/background-glow";

import { authOptions } from "@/lib/auth";
import { getSessionUser } from "@/lib/product-access";
import { syncInAppNotifications } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const user = await getSessionUser();
  let initialNotifications: {
    id: string;
    type: string;
    channel: string;
    sentAt: string;
    readAt: string | null;
    product: {
      id: string;
      name: string;
      brand: string | null;
      warrantyExpiry: string | null;
    };
  }[] = [];

  if (user) {
    await syncInAppNotifications(user.id);
    const logs = await prisma.notificationLog.findMany({
      where: { userId: user.id, channel: "in_app" },
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
      orderBy: { sentAt: "desc" },
      take: 50,
    });

    initialNotifications = logs.map((log) => ({
      id: log.id,
      type: log.type,
      channel: log.channel,
      sentAt: log.sentAt.toISOString(),
      readAt: log.readAt?.toISOString() ?? null,
      product: {
        id: log.product.id,
        name: log.product.name,
        brand: log.product.brand,
        warrantyExpiry: log.product.warrantyExpiry?.toISOString() ?? null,
      },
    }));
  }

  return (
    <div className="relative min-h-screen bg-black text-white">
      <BackgroundGlow />
      <DashboardNavbar
        name={session.user.name}
        initialNotifications={initialNotifications}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
