import { normalizeEmail } from "@/lib/auth-helpers";

export type AccountFileSource = {
  invoiceImage: string | null;
  documents: Array<{ fileUrl: string }>;
};

export function collectProductFileUrls(products: AccountFileSource[]) {
  return products.flatMap((product) => [
    product.invoiceImage,
    ...product.documents.map((doc) => doc.fileUrl),
  ]);
}

export function emailsMatch(left: string, right: string) {
  return normalizeEmail(left) === normalizeEmail(right);
}
