import { addDays, startOfDay } from "date-fns";

import { extendedCoverLabel } from "@/constants/catalog";
import {
  CRITICAL_EXPIRING_DAYS,
  EXPIRING_SOON_DAYS,
  LAST_DAY_REMINDER_DAYS,
} from "@/constants/warranty";
import { getCoverLayers } from "@/lib/coverage";

export type ReminderType =
  | "expiring_30"
  | "expiring_7"
  | "expiring_1"
  | "expired"
  | "renewal_available";

export type ReminderHit = {
  type: ReminderType;
  expiry: Date | null;
  periodKey: string;
  coverLabel: string;
};

type ReminderProduct = {
  warrantyExpiry: Date | null;
  extendedExpiry?: Date | null;
  extendedType?: string | null;
  renewalAvailable: boolean;
};

export function getReminderWindowDates(baseDate = new Date()) {
  const today = startOfDay(baseDate);

  return {
    today,
    in1: addDays(today, LAST_DAY_REMINDER_DAYS),
    in7: addDays(today, CRITICAL_EXPIRING_DAYS),
    in30: addDays(today, EXPIRING_SOON_DAYS),
  };
}

function typeForExpiry(
  expiry: Date,
  today: Date,
  in1: Date,
  in7: Date,
  in30: Date
) {
  const day = startOfDay(expiry);

  if (day <= today) return "expired" as const;
  if (day <= in1) return "expiring_1" as const;
  if (day <= in7) return "expiring_7" as const;
  if (day <= in30) return "expiring_30" as const;
  return null;
}

export function getReminderPeriodKey(
  type: ReminderType,
  warrantyExpiry: Date | null,
  cover: "mfg" | "ext" | "renewal" = "mfg"
) {
  if (type === "renewal_available" && !warrantyExpiry) {
    return "renewal-none";
  }

  if (!warrantyExpiry) {
    return `none-${cover}`;
  }

  return `${startOfDay(warrantyExpiry).toISOString().slice(0, 10)}-${cover}`;
}

export function getReminderHits(
  product: ReminderProduct,
  baseDate = new Date()
): ReminderHit[] {
  const { today, in1, in7, in30 } = getReminderWindowDates(baseDate);
  const hits: ReminderHit[] = [];

  for (const layer of getCoverLayers(product)) {
    const type = typeForExpiry(layer.date, today, in1, in7, in30);
    if (!type) continue;

    const cover = layer.id === "extended" ? "ext" : "mfg";
    hits.push({
      type,
      expiry: layer.date,
      periodKey: getReminderPeriodKey(type, layer.date, cover),
      coverLabel:
        layer.id === "extended"
          ? extendedCoverLabel(product.extendedType)
          : "Manufacturer warranty",
    });
  }

  if (product.renewalAvailable) {
    hits.push({
      type: "renewal_available",
      expiry: product.warrantyExpiry,
      periodKey: getReminderPeriodKey(
        "renewal_available",
        product.warrantyExpiry,
        "renewal"
      ),
      coverLabel: "Renewal",
    });
  }

  return hits;
}

export function getReminderTypes(
  product: ReminderProduct,
  baseDate = new Date()
) {
  return getReminderHits(product, baseDate).map((hit) => hit.type);
}
