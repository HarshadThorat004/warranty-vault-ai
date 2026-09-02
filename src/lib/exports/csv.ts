import { categoryLabel, extendedCoverLabel } from "@/constants/catalog";
import { isoDate } from "@/lib/exports/format";

export type CsvProduct = {
  name: string;
  brand: string | null;
  model: string | null;
  category: string | null;
  retailer: string | null;
  serialNumber: string | null;
  invoiceNumber: string | null;
  purchaseAmount: string | null;
  purchaseDate: Date | string | null;
  warrantyExpiry: Date | string | null;
  extendedExpiry?: Date | string | null;
  extendedType?: string | null;
  notes: string | null;
};

const HEADERS = [
  "Name",
  "Brand",
  "Model",
  "Category",
  "Retailer",
  "Serial",
  "Invoice number",
  "Amount (INR)",
  "Purchase date",
  "Manufacturer expiry",
  "Extended cover",
  "Extended expiry",
  "Notes",
] as const;

function csvCell(value: string) {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function productsToCsv(products: CsvProduct[]) {
  const rows = products.map((product) =>
    [
      product.name,
      product.brand ?? "",
      product.model ?? "",
      categoryLabel(product.category) || product.category || "",
      product.retailer ?? "",
      product.serialNumber ?? "",
      product.invoiceNumber ?? "",
      product.purchaseAmount ?? "",
      isoDate(product.purchaseDate),
      isoDate(product.warrantyExpiry),
      product.extendedExpiry
        ? extendedCoverLabel(product.extendedType)
        : "",
      isoDate(product.extendedExpiry),
      (product.notes ?? "").replace(/\r?\n/g, " "),
    ]
      .map((cell) => csvCell(String(cell)))
      .join(",")
  );

  return ["\uFEFF" + HEADERS.join(","), ...rows].join("\r\n");
}
