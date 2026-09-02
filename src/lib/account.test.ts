import { describe, expect, it } from "vitest";

import { collectProductFileUrls, emailsMatch } from "@/lib/account";

describe("collectProductFileUrls", () => {
  it("flattens invoice covers and document URLs", () => {
    const urls = collectProductFileUrls([
      {
        invoiceImage: "https://utfs.io/a.jpg",
        documents: [{ fileUrl: "https://utfs.io/b.pdf" }],
      },
      {
        invoiceImage: null,
        documents: [{ fileUrl: "https://utfs.io/c.jpg" }],
      },
    ]);

    expect(urls).toEqual([
      "https://utfs.io/a.jpg",
      "https://utfs.io/b.pdf",
      null,
      "https://utfs.io/c.jpg",
    ]);
  });
});

describe("emailsMatch", () => {
  it("compares trimmed lowercase emails", () => {
    expect(emailsMatch("  Ada@Example.com ", "ada@example.com")).toBe(true);
    expect(emailsMatch("ada@example.com", "other@example.com")).toBe(false);
  });
});
