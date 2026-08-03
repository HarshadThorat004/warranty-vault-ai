import { differenceInCalendarDays, addMonths, format } from "date-fns";

import {
  EXPIRING_SOON_DAYS,
  CRITICAL_EXPIRING_DAYS,
} from "@/constants/warranty";

export function getDaysRemaining(expiryDate: Date | string) {
  return differenceInCalendarDays(new Date(expiryDate), new Date());
}

export function isExpired(expiryDate: Date | string) {
  return getDaysRemaining(expiryDate) < 0;
}

export function isExpiringSoon(expiryDate: Date | string) {
  const days = getDaysRemaining(expiryDate);
  return days >= 0 && days <= EXPIRING_SOON_DAYS;
}

export function isCriticalExpiring(expiryDate: Date | string) {
  const days = getDaysRemaining(expiryDate);
  return days >= 0 && days <= CRITICAL_EXPIRING_DAYS;
}

export function getWarrantyStatus(expiryDate: Date | string | null | undefined) {
  if (!expiryDate) {
    return "unknown" as const;
  }

  if (isExpired(expiryDate)) {
    return "expired" as const;
  }

  if (isCriticalExpiring(expiryDate)) {
    return "critical" as const;
  }

  if (isExpiringSoon(expiryDate)) {
    return "expiring" as const;
  }

  return "active" as const;
}

export function computeExpiryFromPeriod(
  purchaseDate: string,
  warrantyPeriodMonths: number | string
) {
  const months =
    typeof warrantyPeriodMonths === "string"
      ? parseInt(warrantyPeriodMonths, 10)
      : warrantyPeriodMonths;

  if (!purchaseDate || Number.isNaN(months) || months <= 0) {
    return null;
  }

  return format(addMonths(new Date(purchaseDate), months), "yyyy-MM-dd");
}

export function getProductThumbnail(product: {
  invoiceImage?: string | null;
  documents?: { fileUrl: string; documentType: string }[];
}) {
  if (product.invoiceImage) {
    return product.invoiceImage;
  }

  const invoice = product.documents?.find(
    (doc) => doc.documentType === "Invoice"
  );

  if (invoice) {
    return invoice.fileUrl;
  }

  return product.documents?.[0]?.fileUrl ?? null;
}
