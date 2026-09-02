import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";

import { buildClaimPackPdf } from "@/lib/exports/claim-pack";
import { productsToCsv } from "@/lib/exports/csv";
import { isoDate, slugifyFilename } from "@/lib/exports/format";
import { productsToIcs } from "@/lib/exports/ics";

const sample = {
  id: "clxyz123",
  name: "Pixel 8, 128GB",
  brand: "Google",
  model: "GZPF0",
  category: "phones",
  retailer: "Flipkart",
  serialNumber: "351234567890123",
  invoiceNumber: "INV-2024/01",
  purchaseAmount: "62999",
  purchaseDate: new Date("2024-06-15T00:00:00.000Z"),
  warrantyExpiry: new Date("2026-06-15T00:00:00.000Z"),
  notes: 'Keep box; "original" invoice inside',
};

describe("format helpers", () => {
  it("formats ISO dates and slugs filenames", () => {
    expect(isoDate(new Date("2026-09-02T18:00:00.000Z"))).toBe("2026-09-02");
    expect(isoDate(null)).toBe("");
    expect(slugifyFilename("Pixel 8 Pro")).toBe("pixel-8-pro");
    expect(slugifyFilename("???")).toBe("product");
  });
});

describe("productsToCsv", () => {
  it("includes a BOM, headers, and escaped cells", () => {
    const csv = productsToCsv([sample]);

    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("Name,Brand,Model,Category");
    expect(csv).toContain("Manufacturer expiry");
    expect(csv).toContain("Phones & tablets");
    expect(csv).toContain('"Pixel 8, 128GB"');
    expect(csv).toContain('"Keep box; ""original"" invoice inside"');
    expect(csv).toContain("2024-06-15");
    expect(csv).toContain("2026-06-15");
    expect(csv).toContain("62999");
  });
});

describe("productsToIcs", () => {
  it("emits an all-day expiry event with exclusive DTEND", () => {
    const ics = productsToIcs([sample], {
      now: new Date("2026-09-02T10:00:00.000Z"),
    });

    expect(ics.startsWith("BEGIN:VCALENDAR")).toBe(true);
    expect(ics).toContain("UID:clxyz123@warrantyvault.in");
    expect(ics).toContain("DTSTAMP:20260902T100000Z");
    expect(ics).toContain("DTSTART;VALUE=DATE:20260615");
    expect(ics).toContain("DTEND;VALUE=DATE:20260616");
    expect(ics).toContain("SUMMARY:Warranty expires: Pixel 8\\, 128GB");
    expect(ics).toContain("END:VCALENDAR");
  });

  it("adds a second event for extended cover", () => {
    const ics = productsToIcs(
      [
        {
          ...sample,
          extendedExpiry: new Date("2028-06-15T00:00:00.000Z"),
          extendedType: "store",
        },
      ],
      { now: new Date("2026-09-02T10:00:00.000Z") }
    );

    expect(ics).toContain("UID:clxyz123-extended@warrantyvault.in");
    expect(ics).toContain("DTSTART;VALUE=DATE:20280615");
    expect(ics).toContain("SUMMARY:Store / retailer expires: Pixel 8\\, 128GB");
  });

  it("skips products without an expiry date", () => {
    const ics = productsToIcs([
      { ...sample, warrantyExpiry: null },
    ]);

    expect(ics).not.toContain("BEGIN:VEVENT");
  });
});

describe("buildClaimPackPdf", () => {
  it("writes a PDF with product facts and a checklist page", async () => {
    const bytes = await buildClaimPackPdf({
      ...sample,
      renewalAvailable: true,
      renewalNotes: "AMC at retailer",
      invoiceImage: "https://evil.example/not-allowed.jpg",
      documents: [
        {
          fileUrl: "https://evil.example/invoice.pdf",
          fileType: "pdf",
          documentType: "Invoice",
        },
      ],
    });

    expect(Buffer.from(bytes).subarray(0, 5).toString()).toBe("%PDF-");

    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBe(2);
    expect(bytes.byteLength).toBeGreaterThan(1000);
  });
});
