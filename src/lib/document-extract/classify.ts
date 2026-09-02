import type { RetailerId } from "@/lib/document-extract/aliases";
import type { ProductCategoryId } from "@/constants/catalog";

const RETAILER_LABELS: Record<Exclude<RetailerId, "unknown">, string> = {
  amazon: "Amazon",
  flipkart: "Flipkart",
  dmart: "DMart",
  croma: "Croma",
  reliance: "Reliance Digital",
  vijay_sales: "Vijay Sales",
  local: "Local store",
};

export function retailerDisplayName(retailer: RetailerId) {
  if (retailer === "unknown") return "";
  return RETAILER_LABELS[retailer];
}

export function inferCategory(
  name: string,
  extraText = ""
): ProductCategoryId | "" {
  const hay = `${name}\n${extraText}`.toLowerCase();

  if (
    /\b(phone|mobile|smartphone|handset|tablet|ipad|iphone|galaxy)\b/.test(hay)
  ) {
    return "phones";
  }

  if (
    /\b(laptop|notebook|ultrabook|chromebook|monitor|keyboard|mouse|ssd|hdd|gpu|printer)\b/.test(
      hay
    )
  ) {
    return "computers";
  }

  if (
    /\b(tv|television|smart\s*tv|headphones?|earbuds?|earphones?|speaker|soundbar|watch|smartwatch)\b/.test(
      hay
    )
  ) {
    return "tv_audio";
  }

  if (
    /\b(refrigerator|fridge|washer|washing\s*machine|ac\b|air\s*conditioner|split\s*ac|microwave|oven|geyser|purifier|fan|cooler|inverter|dishwasher|vacuum|mixer|grinder)\b/.test(
      hay
    )
  ) {
    return "appliances";
  }

  return "";
}
