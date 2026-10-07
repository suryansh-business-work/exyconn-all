import { describe, expect, it } from "vitest";
import { capabilityGroups } from "../../../../src/lib/services/aiHub";

describe("AI capability map", () => {
  it("groups the capabilities into build, models and connect", () => {
    expect(capabilityGroups.map((group) => group.id)).toEqual(["build", "models", "connect"]);
    for (const group of capabilityGroups) {
      expect(group.cards.length).toBeGreaterThan(0);
    }
  });

  it("links every capability to its own page under /ai", () => {
    const hrefs = capabilityGroups.flatMap((group) => group.cards.map((card) => card.href));
    expect(new Set(hrefs).size).toBe(hrefs.length);
    for (const href of hrefs) {
      expect(href).toMatch(/^\/ai\/[a-z-]+$/);
    }
  });
});
