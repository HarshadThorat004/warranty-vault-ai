import { describe, expect, it } from "vitest";

import {
  draftExtractToFormValues,
  extractEmailAddress,
  inferInboundDocumentType,
  isUsableInboundAttachment,
  parseInboundSlug,
} from "@/lib/inbound";
import { emptyExtractedFields } from "@/lib/document-extract/types";

describe("extractEmailAddress", () => {
  it("unwraps display names", () => {
    expect(extractEmailAddress("Amazon <orders@amazon.in>")).toBe(
      "orders@amazon.in"
    );
  });
});

describe("parseInboundSlug", () => {
  it("reads the local part on the inbound domain", () => {
    expect(
      parseInboundSlug(["Name <ab2dk4xq@inbound.warrantyvault.in>"])
    ).toBe("ab2dk4xq");
  });

  it("strips plus-tags and ignores other domains", () => {
    expect(
      parseInboundSlug([
        "other@gmail.com",
        "ab2dk4xq+amazon@inbound.warrantyvault.in",
      ])
    ).toBe("ab2dk4xq");
  });
});

describe("isUsableInboundAttachment", () => {
  it("keeps invoice PDFs and photos", () => {
    expect(
      isUsableInboundAttachment({
        filename: "Invoice.pdf",
        contentType: "application/pdf",
      })
    ).toBe(true);
    expect(
      isUsableInboundAttachment({
        filename: "receipt.jpg",
        contentType: "image/jpeg",
      })
    ).toBe(true);
  });

  it("drops tracking pixels and unknown types", () => {
    expect(
      isUsableInboundAttachment({
        filename: "pixel.gif",
        contentType: "image/gif",
      })
    ).toBe(false);
    expect(
      isUsableInboundAttachment({
        filename: "",
        contentType: "image/png",
        contentDisposition: "inline",
      })
    ).toBe(false);
  });
});

describe("inferInboundDocumentType", () => {
  it("treats warranty in the name as a warranty card", () => {
    expect(
      inferInboundDocumentType({ filename: "warranty-card.pdf", subject: "" })
    ).toBe("Warranty Card");
    expect(
      inferInboundDocumentType({
        filename: "invoice.pdf",
        subject: "Your Amazon.in order",
      })
    ).toBe("Invoice");
  });
});

describe("draftExtractToFormValues", () => {
  it("fills high-confidence fields and derives expiry", () => {
    const extracted = emptyExtractedFields();
    extracted.name = "OnePlus 12";
    extracted.purchaseDate = "2026-01-15";
    extracted.warrantyPeriod = 12;
    extracted.serialNumber = "maybe-wrong";
    extracted.fieldMeta.name = { source: "layout", confidence: "high" };
    extracted.fieldMeta.purchaseDate = { source: "qr", confidence: "high" };
    extracted.fieldMeta.warrantyPeriod = { source: "layout", confidence: "medium" };
    extracted.fieldMeta.serialNumber = { source: "regex", confidence: "low" };

    const values = draftExtractToFormValues(extracted);
    expect(values.name).toBe("OnePlus 12");
    expect(values.purchaseDate).toBe("2026-01-15");
    expect(values.warrantyExpiry).toBe("2027-01-15");
    expect(values.serialNumber).toBe("");
  });
});
