import { describe, expect, it } from "vitest";

import { extractFieldsFromText } from "@/lib/document-extract/field-extractors";
import { mergeExtractedFields } from "@/lib/document-extract/merge";
import { parseGstQrPayload } from "@/lib/document-extract/gst-qr";
import {
  AMAZON_INVOICE,
  CROMA_GST_INVOICE,
  FLIPKART_INVOICE,
  HINDI_INVOICE,
  LOCAL_GST_INVOICE,
  SAMPLE_GSTIN,
  SAMPLE_IMEI,
  WARRANTY_CARD,
} from "@/lib/document-extract/__fixtures__/samples";

describe("extractFieldsFromText fixtures", () => {
  it("reads Amazon marketplace invoice fields", () => {
    const fields = extractFieldsFromText(AMAZON_INVOICE);

    expect(fields.invoiceNumber).toMatch(/406-9607682-5448349|INV-DEL-2025-88421/);
    expect(fields.purchaseDate).toBe("2025-07-24");
    expect(fields.brand).toBe("Sony");
    expect(fields.name.toLowerCase()).toContain("sony");
    expect(fields.sellerGstin).toBe(SAMPLE_GSTIN);
    expect(fields.purchaseAmount).toBe("24990");
    expect(fields.retailer).toBe("Amazon");
    expect(fields.fieldMeta.purchaseDate?.confidence).toBe("high");
  });

  it("reads Flipkart invoice, IMEI, and device warranty", () => {
    const fields = extractFieldsFromText(FLIPKART_INVOICE);

    expect(fields.invoiceNumber).toMatch(/OD435013516609339100|FBF1526004495780/);
    expect(fields.purchaseDate).toBe("2025-06-12");
    expect(fields.brand).toBe("Samsung");
    expect(fields.serialNumber).toBe(SAMPLE_IMEI);
    expect(fields.warrantyPeriod).toBe(12);
    expect(fields.retailer).toBe("Flipkart");
    expect(fields.category).toBe("phones");
    expect(fields.name.toLowerCase()).toMatch(/galaxy|samsung/);
  });

  it("reads a Croma GST invoice", () => {
    const fields = extractFieldsFromText(CROMA_GST_INVOICE);

    expect(fields.invoiceNumber).toBe("CR/2526/001234");
    expect(fields.purchaseDate).toBe("2025-03-15");
    expect(fields.brand).toBe("LG");
    expect(fields.serialNumber).toBe("LGAC15T2025X");
    expect(fields.warrantyPeriod).toBe(12);
    expect(fields.sellerGstin).toBe(SAMPLE_GSTIN);
    expect(fields.purchaseAmount).toBe("42990");
  });

  it("reads a local tax invoice", () => {
    const fields = extractFieldsFromText(LOCAL_GST_INVOICE);

    expect(fields.invoiceNumber).toBe("SE/25-26/00412");
    expect(fields.purchaseDate).toBe("2025-02-18");
    expect(fields.brand).toBe("Bosch");
    expect(fields.serialNumber).toBe("BOSCH-FL-88912");
    expect(fields.warrantyPeriod).toBe(24);
    expect(fields.name.toLowerCase()).toContain("bosch");
  });

  it("reads a typed warranty card", () => {
    const fields = extractFieldsFromText(WARRANTY_CARD);

    expect(fields.brand).toBe("LG");
    expect(fields.serialNumber).toBe("3AB12C345678");
    expect(fields.purchaseDate).toBe("2025-01-08");
    expect(fields.warrantyPeriod).toBe(12);
    expect(fields.name.toLowerCase()).toContain("lg");
    expect(fields.model).toBe("TS-Q19UNZE");
    expect(fields.category).toBe("appliances");
    expect(fields.fieldMeta.serialNumber?.confidence).toBe("high");
  });

  it("marks an unlabelled date as low confidence", () => {
    const fields = extractFieldsFromText(
      "Thank you for shopping\nPrinted 11/09/2024\nSony headphones"
    );

    expect(fields.purchaseDate).toBe("2024-09-11");
    expect(fields.fieldMeta.purchaseDate?.confidence).toBe("low");
  });

  it("drops an IMEI that fails Luhn", () => {
    const fields = extractFieldsFromText(
      "Flipkart\nIMEI: 356938035643800\nInvoice Date: 12/06/2025"
    );

    expect(fields.serialNumber).toBe("");
  });
});

describe("mergeExtractedFields", () => {
  it("lets GST QR win over OCR on overlapping fields", () => {
    const ocr = extractFieldsFromText(LOCAL_GST_INVOICE);
    const qr = parseGstQrPayload(
      JSON.stringify({
        SellerGstin: SAMPLE_GSTIN,
        DocNo: "QR-DOC-99",
        DocDt: "01/01/2025",
        TotInvVal: 111,
      })
    );

    expect(qr).not.toBeNull();
    const merged = mergeExtractedFields(ocr, qr!);

    expect(merged.invoiceNumber).toBe("QR-DOC-99");
    expect(merged.purchaseDate).toBe("2025-01-01");
    expect(merged.brand).toBe("Bosch");
    expect(merged.fieldMeta.invoiceNumber?.source).toBe("qr");
  });
});

describe("Hindi invoice labels", () => {
  it("reads चालान, दिनांक, सीरियल, and महीने", () => {
    const fields = extractFieldsFromText(HINDI_INVOICE);

    expect(fields.invoiceNumber).toBe("INV-HIN-2044");
    expect(fields.purchaseDate).toBe("2024-06-15");
    expect(fields.serialNumber).toBe(SAMPLE_IMEI);
    expect(fields.warrantyPeriod).toBe(12);
    expect(fields.brand).toBe("Samsung");
  });
});
