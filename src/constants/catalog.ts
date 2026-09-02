export const PRODUCT_CATEGORIES = [
  { id: "phones", label: "Phones & tablets" },
  { id: "computers", label: "Computers" },
  { id: "appliances", label: "Home appliances" },
  { id: "tv_audio", label: "TV & audio" },
  { id: "other", label: "Other" },
] as const;

export type ProductCategoryId = (typeof PRODUCT_CATEGORIES)[number]["id"];

export function categoryLabel(id: string | null | undefined) {
  return PRODUCT_CATEGORIES.find((item) => item.id === id)?.label ?? id ?? "";
}

export const EXTENDED_COVER_TYPES = [
  { id: "store", label: "Store / retailer" },
  { id: "extended", label: "Brand extended" },
  { id: "amc", label: "AMC" },
  { id: "insurance", label: "Insurance" },
] as const;

export type ExtendedCoverId = (typeof EXTENDED_COVER_TYPES)[number]["id"];

export function extendedCoverLabel(id: string | null | undefined) {
  return (
    EXTENDED_COVER_TYPES.find((item) => item.id === id)?.label ??
    "Store / extended"
  );
}
