import { describe, expect, it } from "vitest";

import { canAutofillField } from "@/lib/document-extract/apply-scan";
import { gstinCheckDigit, isValidGstin, isValidImei } from "@/lib/document-extract/validate";
import { SAMPLE_GSTIN, SAMPLE_IMEI } from "@/lib/document-extract/__fixtures__/samples";

describe("GSTIN checksum", () => {
  it("accepts a self-checksummed GSTIN", () => {
    expect(SAMPLE_GSTIN).toHaveLength(15);
    expect(isValidGstin(SAMPLE_GSTIN)).toBe(true);
    expect(gstinCheckDigit(SAMPLE_GSTIN.slice(0, 14))).toBe(SAMPLE_GSTIN[14]);
  });

  it("rejects a GSTIN with a tampered check digit", () => {
    const last = SAMPLE_GSTIN[14] === "A" ? "B" : "A";
    expect(isValidGstin(`${SAMPLE_GSTIN.slice(0, 14)}${last}`)).toBe(false);
  });

  it("rejects the wrong shape", () => {
    expect(isValidGstin("27ABC")).toBe(false);
    expect(isValidGstin("")).toBe(false);
  });
});

describe("IMEI Luhn", () => {
  it("accepts a generated 15-digit IMEI", () => {
    expect(SAMPLE_IMEI).toHaveLength(15);
    expect(isValidImei(SAMPLE_IMEI)).toBe(true);
  });

  it("rejects a 15-digit number that fails Luhn", () => {
    expect(isValidImei("356938035643800")).toBe(false);
  });
});

describe("canAutofillField", () => {
  it("fills high and medium confidence when the user has not edited", () => {
    expect(
      canAutofillField({ hasValue: true, userEdited: false, confidence: "high" })
    ).toBe(true);
    expect(
      canAutofillField({
        hasValue: true,
        userEdited: false,
        confidence: "medium",
      })
    ).toBe(true);
  });

  it("skips low confidence and user-edited fields", () => {
    expect(
      canAutofillField({ hasValue: true, userEdited: false, confidence: "low" })
    ).toBe(false);
    expect(
      canAutofillField({ hasValue: true, userEdited: true, confidence: "high" })
    ).toBe(false);
    expect(
      canAutofillField({ hasValue: false, userEdited: false, confidence: "high" })
    ).toBe(false);
  });
});
