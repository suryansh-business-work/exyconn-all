import { describe, expect, it } from "vitest";
import { LEGAL_LINKS, relatedLegalLinks } from "../../../../src/lib/legal/related";

describe("related legal links", () => {
  it("names each legal page once, at a site path", () => {
    expect(new Set(LEGAL_LINKS.map((link) => link.key)).size).toBe(LEGAL_LINKS.length);
    for (const link of LEGAL_LINKS) {
      expect(link.href).toMatch(/^\/[a-z-]+$/);
    }
  });

  it("lists every legal page except the one being read, in order", () => {
    const related = relatedLegalLinks("cookies");
    expect(related.map((link) => link.key)).toEqual([
      "privacy",
      "policies",
      "legal",
      "grievance",
      "contact",
    ]);
  });
});
