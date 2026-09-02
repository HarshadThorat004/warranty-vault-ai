import { describe, expect, it } from "vitest";

import { reminderPushPayload } from "@/lib/push";

describe("reminderPushPayload", () => {
  it("points at the product and names the cover", () => {
    expect(
      reminderPushPayload({
        type: "expiring_1",
        productName: "Pixel 8",
        productId: "abc",
        coverLabel: "Store / retailer",
      })
    ).toEqual({
      title: "Store / retailer expires tomorrow",
      body: "Pixel 8",
      url: "/dashboard/products/abc",
    });
  });
});
