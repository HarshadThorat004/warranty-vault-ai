import { describe, expect, it } from "vitest";

import { safeAuthCallbackUrl } from "@/lib/auth-callback";
import {
  canAddHouseholdSeat,
  canJoinHousehold,
  reminderRecipients,
  uniqueById,
  vaultProductWhere,
} from "@/lib/household";

describe("vaultProductWhere", () => {
  it("scopes a personal vault to that user and unshared products", () => {
    expect(vaultProductWhere("u1", null)).toEqual({
      userId: "u1",
      householdId: null,
    });
  });

  it("lets household members see the shared vault plus leftover personal products", () => {
    expect(vaultProductWhere("u1", "h1")).toEqual({
      OR: [{ householdId: "h1" }, { householdId: null, userId: "u1" }],
    });
  });
});

describe("canAddHouseholdSeat", () => {
  it("counts members and pending invites against the cap", () => {
    expect(canAddHouseholdSeat(1, 0)).toBe(true);
    expect(canAddHouseholdSeat(4, 1)).toBe(false);
    expect(canAddHouseholdSeat(3, 1)).toBe(true);
  });
});

describe("canJoinHousehold", () => {
  it("allows a solo user to merge into the inviting vault", () => {
    expect(canJoinHousehold(0)).toEqual({ ok: true });
  });

  it("refuses if the invitee already shares a vault with someone else", () => {
    const result = canJoinHousehold(1);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toMatch(/Leave your current household/i);
    }
  });
});

describe("reminderRecipients", () => {
  it("falls back to the product owner when there is no household", () => {
    expect(reminderRecipients({ id: "owner" }, undefined)).toEqual([
      { id: "owner" },
    ]);
  });

  it("dedupes household members", () => {
    expect(
      reminderRecipients({ id: "owner" }, [
        { id: "a" },
        { id: "owner" },
        { id: "a" },
      ])
    ).toEqual([{ id: "a" }, { id: "owner" }]);
  });
});

describe("uniqueById", () => {
  it("keeps first occurrence", () => {
    expect(uniqueById([{ id: "1" }, { id: "2" }, { id: "1" }])).toEqual([
      { id: "1" },
      { id: "2" },
    ]);
  });
});

describe("safeAuthCallbackUrl", () => {
  it("allows dashboard and invite links only", () => {
    expect(safeAuthCallbackUrl("/dashboard")).toBe("/dashboard");
    expect(safeAuthCallbackUrl("/invite/abc_DEF-123")).toBe(
      "/invite/abc_DEF-123"
    );
    expect(safeAuthCallbackUrl("https://evil.example")).toBe("/dashboard");
    expect(safeAuthCallbackUrl("//evil.example")).toBe("/dashboard");
    expect(safeAuthCallbackUrl("/login")).toBe("/dashboard");
  });
});
