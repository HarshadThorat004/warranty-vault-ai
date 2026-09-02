import { describe, expect, it } from "vitest";
import QRCode from "qrcode";
import sharp from "sharp";

import {
  decodeGstQrFromImage,
  parseGstQrPayload,
} from "@/lib/document-extract/gst-qr";
import { SAMPLE_GSTIN } from "@/lib/document-extract/__fixtures__/samples";

const payload = {
  SellerGstin: SAMPLE_GSTIN,
  BuyerGstin: "29AAGCB2781D1ZU",
  DocNo: "INV/2526/00412",
  DocTyp: "INV",
  DocDt: "18/02/2025",
  TotInvVal: 32490,
  ItemCnt: 1,
  MainHsnCode: "8450",
  Irn: "a".repeat(64),
};

describe("parseGstQrPayload", () => {
  it("reads a NIC JSON payload", () => {
    const fields = parseGstQrPayload(JSON.stringify(payload));

    expect(fields?.invoiceNumber).toBe("INV/2526/00412");
    expect(fields?.purchaseDate).toBe("2025-02-18");
    expect(fields?.sellerGstin).toBe(SAMPLE_GSTIN);
    expect(fields?.purchaseAmount).toBe("32490");
    expect(fields?.fieldMeta.invoiceNumber).toEqual({
      source: "qr",
      confidence: "high",
    });
  });

  it("reads unquoted NIC-style JSON", () => {
    const raw = `{SellerGstin:${SAMPLE_GSTIN},DocNo:SE/25-26/00412,DocDt:18/02/2025,TotInvVal:32490.5}`;
    const fields = parseGstQrPayload(raw);

    expect(fields?.invoiceNumber).toBe("SE/25-26/00412");
    expect(fields?.purchaseDate).toBe("2025-02-18");
    expect(fields?.sellerGstin).toBe(SAMPLE_GSTIN);
    expect(fields?.purchaseAmount).toBe("32490.5");
  });

  it("reads a JWT-shaped signed QR", () => {
    const header = Buffer.from(JSON.stringify({ alg: "none" })).toString(
      "base64url"
    );
    const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const fields = parseGstQrPayload(`${header}.${body}.sig`);

    expect(fields?.invoiceNumber).toBe("INV/2526/00412");
    expect(fields?.sellerGstin).toBe(SAMPLE_GSTIN);
  });

  it("drops an invalid GSTIN instead of inventing", () => {
    const broken = `${SAMPLE_GSTIN.slice(0, 14)}${SAMPLE_GSTIN[14] === "A" ? "B" : "A"}`;
    const fields = parseGstQrPayload(
      JSON.stringify({
        ...payload,
        SellerGstin: broken,
        DocNo: "INV-1",
      })
    );

    expect(fields?.invoiceNumber).toBe("INV-1");
    expect(fields?.sellerGstin).toBe("");
  });
});

describe("decodeGstQrFromImage", () => {
  it("returns null on a blank image", async () => {
    const blank = await sharp({
      create: {
        width: 200,
        height: 200,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    })
      .png()
      .toBuffer();

    expect(await decodeGstQrFromImage(blank)).toBeNull();
  });

  it("decodes a GST QR from a generated PNG", async () => {
    const png = await QRCode.toBuffer(JSON.stringify(payload), {
      type: "png",
      width: 480,
      margin: 2,
      errorCorrectionLevel: "M",
    });

    const fields = await decodeGstQrFromImage(png);

    expect(fields?.invoiceNumber).toBe("INV/2526/00412");
    expect(fields?.purchaseDate).toBe("2025-02-18");
    expect(fields?.sellerGstin).toBe(SAMPLE_GSTIN);
  });
});
