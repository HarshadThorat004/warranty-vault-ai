import { addDays, startOfDay } from "date-fns";
import { describe, expect, it } from "vitest";

import {
  getCoverageStatus,
  getCoverLayers,
  getEffectiveCover,
} from "@/lib/coverage";
import { getReminderHits } from "@/lib/reminders";

describe("getCoverLayers", () => {
  it("returns manufacturer and extended covers", () => {
    const layers = getCoverLayers({
      warrantyExpiry: new Date("2025-01-15T00:00:00.000Z"),
      extendedExpiry: new Date("2027-01-15T00:00:00.000Z"),
      extendedType: "store",
    });

    expect(layers.map((layer) => layer.id)).toEqual([
      "manufacturer",
      "extended",
    ]);
    expect(layers[1]?.label).toBe("Store / retailer");
  });
});

describe("getEffectiveCover", () => {
  it("picks the next upcoming cover, not the later one", () => {
    const now = new Date("2026-09-01T00:00:00.000Z");
    const cover = getEffectiveCover(
      {
        warrantyExpiry: new Date("2026-09-10T00:00:00.000Z"),
        extendedExpiry: new Date("2028-01-01T00:00:00.000Z"),
        extendedType: "amc",
      },
      now
    );

    expect(cover?.id).toBe("manufacturer");
    expect(getCoverageStatus(
      {
        warrantyExpiry: new Date("2026-09-10T00:00:00.000Z"),
        extendedExpiry: new Date("2028-01-01T00:00:00.000Z"),
      },
      now
    )).toBe("expiring");
  });

  it("treats manufacturer-expired + live extended as active", () => {
    const now = new Date("2026-09-01T00:00:00.000Z");
    const status = getCoverageStatus(
      {
        warrantyExpiry: new Date("2025-01-01T00:00:00.000Z"),
        extendedExpiry: new Date("2027-01-01T00:00:00.000Z"),
        extendedType: "store",
      },
      now
    );

    expect(status).toBe("active");
    expect(
      getEffectiveCover(
        {
          warrantyExpiry: new Date("2025-01-01T00:00:00.000Z"),
          extendedExpiry: new Date("2027-01-01T00:00:00.000Z"),
        },
        now
      )?.id
    ).toBe("extended");
  });
});

describe("getReminderHits", () => {
  it("emits separate period keys for manufacturer and extended", () => {
    const now = new Date("2026-09-01T00:00:00.000Z");
    const hits = getReminderHits(
      {
        warrantyExpiry: addDays(startOfDay(now), 5),
        extendedExpiry: addDays(startOfDay(now), 20),
        extendedType: "store",
        renewalAvailable: false,
      },
      now
    );

    expect(hits.map((hit) => hit.type)).toEqual([
      "expiring_7",
      "expiring_30",
    ]);
    expect(hits[0]?.periodKey).toContain("-mfg");
    expect(hits[1]?.periodKey).toContain("-ext");
  });

  it("uses expiring_1 the day before cover ends", () => {
    const now = new Date("2026-09-01T00:00:00.000Z");
    const hits = getReminderHits(
      {
        warrantyExpiry: addDays(startOfDay(now), 1),
        renewalAvailable: false,
      },
      now
    );

    expect(hits.map((hit) => hit.type)).toEqual(["expiring_1"]);
  });
});
