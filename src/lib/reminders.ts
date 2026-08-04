import { addDays, startOfDay } from "date-fns";

import {
  CRITICAL_EXPIRING_DAYS,
  EXPIRING_SOON_DAYS,
} from "@/constants/warranty";

export type ReminderType =
  | "expiring_30"
  | "expiring_7"
  | "expired"
  | "renewal_available";

type ReminderProduct = {
  warrantyExpiry: Date | null;
  renewalAvailable: boolean;
};

export function getReminderWindowDates(baseDate = new Date()) {
  const today = startOfDay(baseDate);

  return {
    today,
    in7: addDays(today, CRITICAL_EXPIRING_DAYS),
    in30: addDays(today, EXPIRING_SOON_DAYS),
  };
}

export function getReminderTypes(
  product: ReminderProduct,
  baseDate = new Date()
) {
  const { today, in7, in30 } = getReminderWindowDates(baseDate);
  const types: ReminderType[] = [];

  if (product.warrantyExpiry) {
    const expiry = startOfDay(product.warrantyExpiry);

    if (expiry <= today) {
      types.push("expired");
    } else if (expiry <= in7) {
      types.push("expiring_7");
    } else if (expiry <= in30) {
      types.push("expiring_30");
    }
  }

  if (product.renewalAvailable) {
    types.push("renewal_available");
  }

  return types;
}

export function getReminderPeriodKey(
  type: ReminderType,
  warrantyExpiry: Date | null
) {
  if (type === "renewal_available" && !warrantyExpiry) {
    return "renewal-none";
  }

  if (!warrantyExpiry) {
    return "none";
  }

  return startOfDay(warrantyExpiry).toISOString().slice(0, 10);
}
