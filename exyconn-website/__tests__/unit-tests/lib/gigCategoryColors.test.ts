/** The freelance-gig category colours and their listing order. */
import { describe, expect, it } from "vitest";
import { gigCategoryColors, groupByGigCategory } from "../../../src/lib/gigCategoryColors";

describe("gigCategoryColors", () => {
  it("paints a known category in its own hue", () => {
    expect(gigCategoryColors("Development")).toEqual({
      tint: "var(--color-blue-soft)",
      ink: "var(--color-blue-fg)",
      solid: "var(--color-blue)",
    });
    expect(gigCategoryColors("AI/ML").solid).toBe("var(--color-indigo)");
  });

  it("paints Other and unknown categories neutral", () => {
    const neutral = {
      tint: "var(--color-surface-muted)",
      ink: "var(--color-fg-muted)",
      solid: "var(--color-fg-subtle)",
    };
    expect(gigCategoryColors("Other")).toEqual(neutral);
    expect(gigCategoryColors("Blockchain")).toEqual(neutral);
  });
});

describe("groupByGigCategory", () => {
  it("groups in the map's order, unknown categories after, alphabetically", () => {
    const items = [
      { id: 1, category: "Zebra" },
      { id: 2, category: "Other" },
      { id: 3, category: "Design" },
      { id: 4, category: "Alpha" },
      { id: 5, category: "Development" },
      { id: 6, category: "Design" },
    ];
    const groups = groupByGigCategory(items);
    expect(groups.map((group) => group.category)).toEqual([
      "Development",
      "Design",
      "Other",
      "Alpha",
      "Zebra",
    ]);
    expect(groups[1]?.items.map((item) => item.id)).toEqual([3, 6]);
  });

  it("lists every item exactly once", () => {
    const items = ["Data", "Video", "Data", "Writing", "Marketing"].map((category, id) => ({
      id,
      category,
    }));
    const flat = groupByGigCategory(items).flatMap((group) => group.items);
    expect(flat).toHaveLength(items.length);
    expect(new Set(flat.map((item) => item.id)).size).toBe(items.length);
  });

  it("returns no groups for no items", () => {
    expect(groupByGigCategory([])).toEqual([]);
  });
});
