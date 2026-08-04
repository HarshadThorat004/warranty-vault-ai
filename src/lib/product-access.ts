import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getSessionUser() {
  const session = await getServerSession(authOptions);

  const userId = session?.user?.id;
  const email = session?.user?.email;

  if (!userId && !email) {
    return null;
  }

  const user = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
      })
    : await prisma.user.findUnique({
        where: { email: email! },
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
