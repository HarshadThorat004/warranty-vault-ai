import { describe, expect, it } from "vitest";

import { extractFieldsFromText } from "@/lib/document-extract/field-extractors";
import { emptyExtractedFields } from "@/lib/document-extract/types";
import { mergeByDocumentType } from "@/lib/document-extract/merge-scan";
import { scanDocumentFromText } from "@/lib/document-extract";
import {
  FLIPKART_INVOICE,
  WARRANTY_CARD,
} from "@/lib/document-extract/__fixtures__/samples";

describe("mergeByDocumentType", () => {
  it("lets a warranty card add serial and period without wiping invoice number", () => {
    const invoice = extractFieldsFromText(FLIPKART_INVOICE);
    const card = extractFieldsFromText(WARRANTY_CARD);
    const merged = mergeByDocumentType(invoice, card, "Warranty Card");

    expect(merged.invoiceNumber).toBe(invoice.invoiceNumber);
    expect(merged.purchaseDate).toBe(invoice.purchaseDate);
    expect(merged.serialNumber).toBe(card.serialNumber);
    expect(merged.warrantyPeriod).toBe(12);
  });

  it("lets an invoice add date and amount without wiping card serial", () => {
    const card = extractFieldsFromText(WARRANTY_CARD);
    const invoice = extractFieldsFromText(FLIPKART_INVOICE);
    const merged = mergeByDocumentType(card, invoice, "Invoice");

    expect(merged.serialNumber).toBe(card.serialNumber);
    expect(merged.invoiceNumber).toBe(invoice.invoiceNumber);
    expect(merged.purchaseDate).toBe(invoice.purchaseDate);
  });
});

describe("scanDocumentFromText", () => {
  it("parses client OCR text without fetching an image", () => {
    const fields = scanDocumentFromText(WARRANTY_CARD);

    expect(fields.brand).toBe("LG");
    expect(fields.serialNumber).toBe("3AB12C345678");
    expect(fields.model).toBe("TS-Q19UNZE");
    expect(fields.category).toBe("appliances");
  });

  it("throws when nothing usable is found", () => {
    expect(() => scanDocumentFromText("thank you\npage 1")).toThrow(
      /unable to scan/i
    );
  });
});

describe("catalog inference", () => {
  it("does not invent fields on an empty extract", () => {
    const empty = emptyExtractedFields();
    expect(empty.model).toBe("");
    expect(empty.retailer).toBe("");
    expect(empty.category).toBe("");
  });
});
