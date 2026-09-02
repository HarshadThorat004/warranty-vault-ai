import type { Prisma } from "@prisma/client";

import { productStatusWhere } from "@/lib/coverage";
import { getHouseholdIdForUser, vaultProductWhere } from "@/lib/household";
import { prisma } from "@/lib/prisma";
import { getReminderWindowDates } from "@/lib/reminders";

export type ProductListStatus = "all" | "active" | "expiring" | "expired";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export function parseProductListParams(searchParams: URLSearchParams) {
  const rawLimit = Number(searchParams.get("limit") ?? DEFAULT_LIMIT);
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(1, rawLimit), MAX_LIMIT)
    : DEFAULT_LIMIT;
  const cursor = searchParams.get("cursor") || undefined;
  const q = searchParams.get("q")?.trim() || undefined;
  const rawStatus = searchParams.get("status");
  const status: ProductListStatus =
    rawStatus === "active" ||
    rawStatus === "expiring" ||
    rawStatus === "expired" ||
    rawStatus === "all"
      ? rawStatus
      : "all";

  return {
    cursor,
    limit,
    q,
    status,
  };
}

export function buildProductWhere(
  userId: string,
  householdId: string | null,
  params: {
    q?: string;
    status?: ProductListStatus;
  }
): Prisma.ProductWhereInput {
  const { today, in30 } = getReminderWindowDates();
  const clauses: Prisma.ProductWhereInput[] = [
    vaultProductWhere(userId, householdId),
  ];

  if (params.q) {
    clauses.push({
      OR: [
        { name: { contains: params.q, mode: "insensitive" } },
        { brand: { contains: params.q, mode: "insensitive" } },
        { model: { contains: params.q, mode: "insensitive" } },
        { retailer: { contains: params.q, mode: "insensitive" } },
        { serialNumber: { contains: params.q, mode: "insensitive" } },
        { invoiceNumber: { contains: params.q, mode: "insensitive" } },
      ],
    });
  }

  if (params.status && params.status !== "all") {
    const extra = productStatusWhere(params.status, today, in30);
    if (extra) clauses.push(extra);
  }

  return clauses.length === 1
    ? clauses[0]
    : {
        AND: clauses,
      };
}

const productListSelect = {
  id: true,
  name: true,
  brand: true,
  model: true,
  category: true,
  retailer: true,
  serialNumber: true,
  invoiceNumber: true,
  purchaseAmount: true,
  purchaseDate: true,
  warrantyExpiry: true,
  extendedExpiry: true,
  extendedType: true,
  invoiceImage: true,
  notes: true,
  renewalAvailable: true,
  renewalNotes: true,
  createdAt: true,
  userId: true,
  documents: {
    select: {
      id: true,
      fileUrl: true,
      fileType: true,
      documentType: true,
    },
    orderBy: {
      uploadedAt: "desc" as const,
    },
    take: 3,
  },
} satisfies Prisma.ProductSelect;

export async function listProductsForUser(
  userId: string,
  params: {
    cursor?: string;
    limit?: number;
    q?: string;
    status?: ProductListStatus;
  }
) {
  const take = Math.min(Math.max(1, params.limit ?? DEFAULT_LIMIT), MAX_LIMIT);
  const householdId = await getHouseholdIdForUser(userId);
  const where = buildProductWhere(userId, householdId, {
    q: params.q,
    status: params.status ?? "all",
  });

  const products = await prisma.product.findMany({
    where,
    orderBy: [
      { createdAt: "desc" },
      { id: "desc" },
    ],
    ...(params.cursor
      ? {
          cursor: { id: params.cursor },
          skip: 1,
        }
      : {}),
    take: take + 1,
    select: productListSelect,
  });

  const hasMore = products.length > take;
  const items = hasMore ? products.slice(0, take) : products;

  return {
    items,
    nextCursor: hasMore ? items.at(-1)?.id ?? null : null,
    hasMore,
  };
}

const productExportSelect = {
  id: true,
  name: true,
  brand: true,
  model: true,
  category: true,
  retailer: true,
  serialNumber: true,
  invoiceNumber: true,
  purchaseAmount: true,
  purchaseDate: true,
  warrantyExpiry: true,
  extendedExpiry: true,
  extendedType: true,
  notes: true,
} satisfies Prisma.ProductSelect;

export async function listProductsForExport(userId: string, productId?: string) {
  const householdId = await getHouseholdIdForUser(userId);
  const vault = vaultProductWhere(userId, householdId);

  return prisma.product.findMany({
    where: productId
      ? { AND: [{ id: productId }, vault] }
      : vault,
    orderBy: [{ name: "asc" }, { id: "asc" }],
    select: productExportSelect,
  });
}

export async function getDashboardCounts(userId: string) {
  const { today, in30 } = getReminderWindowDates();
  const householdId = await getHouseholdIdForUser(userId);
  const vault = vaultProductWhere(userId, householdId);

  const [totalProducts, activeProducts, expiringProducts, expiredProducts] =
    await Promise.all([
      prisma.product.count({
        where: vault,
      }),
      prisma.product.count({
        where: {
          AND: [vault, productStatusWhere("active", today, in30) ?? {}],
        },
      }),
      prisma.product.count({
        where: {
          AND: [vault, productStatusWhere("expiring", today, in30) ?? {}],
        },
      }),
      prisma.product.count({
        where: {
          AND: [vault, productStatusWhere("expired", today, in30) ?? {}],
        },
      }),
    ]);

  return {
    totalProducts,
    activeProducts,
    expiringProducts,
    expiredProducts,
  };
}
