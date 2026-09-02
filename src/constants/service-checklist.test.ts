import { describe, expect, it } from "vitest";

import { getServiceChecklist } from "@/constants/service-checklist";

describe("getServiceChecklist", () => {
  it("returns phone-specific IMEI guidance", () => {
    const list = getServiceChecklist("phones");
    expect(list.items.some((item) => item.includes("IMEI"))).toBe(true);
    expect(list.items.some((item) => item.includes("claim pack"))).toBe(true);
  });

  it("falls back to a generic list", () => {
    expect(getServiceChecklist(null).title).toMatch(/claim/i);
    expect(getServiceChecklist("unknown").items.length).toBeGreaterThan(2);
  });
});
