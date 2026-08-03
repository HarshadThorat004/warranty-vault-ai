import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getSessionUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  return user;
}

export async function assertProductOwner(productId: string) {
  const user = await getSessionUser();

  if (!user) {
    return { error: "Unauthorized" as const, status: 401 as const, user: null, product: null };
  }

  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      userId: user.id,
    },
    include: {
      documents: true,
    },
  });

  if (!product) {
    return { error: "Product not found" as const, status: 404 as const, user, product: null };
  }

  return { error: null, status: 200 as const, user, product };
}
