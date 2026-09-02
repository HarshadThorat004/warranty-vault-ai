import type { Prisma } from "@prisma/client";
import { differenceInCalendarDays, startOfDay } from "date-fns";

import { extendedCoverLabel } from "@/constants/catalog";
import { EXPIRING_SOON_DAYS } from "@/constants/warranty";

export type CoverProduct = {
  warrantyExpiry: Date | string | null | undefined;
  extendedExpiry?: Date | string | null;
  extendedType?: string | null;
};

export type CoverLayer = {
  id: "manufacturer" | "extended";
  label: string;
  date: Date;
};

function asDate(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function getCoverLayers(product: CoverProduct): CoverLayer[] {
  const layers: CoverLayer[] = [];
  const manufacturer = asDate(product.warrantyExpiry);
  const extended = asDate(product.extendedExpiry);

  if (manufacturer) {
    layers.push({
      id: "manufacturer",
      label: "Manufacturer",
      date: manufacturer,
    });
  }

  if (extended) {
    layers.push({
      id: "extended",
      label: extendedCoverLabel(product.extendedType),
      date: extended,
    });
  }

  return layers;
}

export function getEffectiveCover(product: CoverProduct, now = new Date()) {
  const today = startOfDay(now);
  const layers = getCoverLayers(product);

  if (layers.length === 0) return null;

  const upcoming = layers
    .filter((layer) => startOfDay(layer.date) >= today)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (upcoming[0]) return upcoming[0];

  return [...layers].sort((a, b) => b.date.getTime() - a.date.getTime())[0];
}

export function getEffectiveExpiry(product: CoverProduct, now = new Date()) {
  return getEffectiveCover(product, now)?.date ?? null;
}

export function getCoverageStatus(
  product: CoverProduct,
  now = new Date()
): "active" | "expiring" | "expired" | "unknown" {
  const expiry = getEffectiveExpiry(product, now);

  if (!expiry) return "unknown";

  const days = differenceInCalendarDays(expiry, now);
  if (days < 0) return "expired";
  if (days <= EXPIRING_SOON_DAYS) return "expiring";
  return "active";
}

export function productStatusWhere(
  status: "all" | "active" | "expiring" | "expired",
  today: Date,
  in30: Date
): Prisma.ProductWhereInput | undefined {
  if (status === "all") return undefined;

  const hasFutureCover: Prisma.ProductWhereInput = {
    OR: [
      { warrantyExpiry: { gte: today } },
      { extendedExpiry: { gte: today } },
    ],
  };

  const inWindow: Prisma.ProductWhereInput = {
    OR: [
      { warrantyExpiry: { gte: today, lte: in30 } },
      { extendedExpiry: { gte: today, lte: in30 } },
    ],
  };

  if (status === "expired") {
    return {
      AND: [
        {
          OR: [
            { warrantyExpiry: { not: null } },
            { extendedExpiry: { not: null } },
          ],
        },
        { NOT: hasFutureCover },
      ],
    };
  }

  if (status === "expiring") {
    return {
      AND: [hasFutureCover, inWindow],
    };
  }

  return {
    AND: [hasFutureCover, { NOT: inWindow }],
  };
}
