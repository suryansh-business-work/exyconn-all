/** The tools directory: the catalogue by category, safe accent colours, cubes and monograms. */
import { describe, expect, it } from "vitest";
import {
  cssColor,
  cubeCount,
  MAX_CUBES,
  monogram,
  toolCatalogue,
} from "../../../../src/lib/content/tools";
import { tool, toolCategory } from "../cms/fixtures";

describe("toolCatalogue", () => {
  const dev = toolCategory({ id: "c1", slug: "dev", order: 2 });
  const brand = toolCategory({ id: "c2", slug: "brand", order: 1 });
  const empty = toolCategory({ id: "c3", slug: "empty", order: 0 });

  it("orders entries by category then tool order and counts populated categories", () => {
    const tools = [
      tool({ toolCode: "dev-b", categorySlug: "dev", order: 2 }),
      tool({ toolCode: "brand-a", categorySlug: "brand", order: 1 }),
      tool({ toolCode: "dev-a", categorySlug: "dev", order: 1 }),
      tool({ toolCode: "orphan", categorySlug: "unpublished", order: 0 }),
    ];
    const { categories, entries } = toolCatalogue([dev, empty, brand], tools);
    expect(entries.map((entry) => entry.tool.toolCode)).toEqual(["brand-a", "dev-a", "dev-b"]);
    expect(entries[0].category).toBe(brand);
    expect(categories).toEqual([
      { category: brand, count: 1 },
      { category: dev, count: 2 },
    ]);
  });

  it("is empty without categories or tools", () => {
    expect(toolCatalogue([], [tool()])).toEqual({ categories: [], entries: [] });
    expect(toolCatalogue([dev], [])).toEqual({ categories: [], entries: [] });
  });
});

describe("cubeCount", () => {
  it("draws a cube per tool up to the maximum, generic when there are none", () => {
    expect(cubeCount(1)).toBe(1);
    expect(cubeCount(MAX_CUBES)).toBe(12);
    expect(cubeCount(50)).toBe(12);
    expect(cubeCount(0)).toBeUndefined();
  });
});

describe("cssColor", () => {
  it("accepts hex of 3, 4, 6 and 8 digits, colour functions and names, trimmed", () => {
    for (const colour of ["#abc", "#abcd", "#7C3AED", "#7c3aed80", "teal"]) {
      expect(cssColor(colour)).toBe(colour);
    }
    expect(cssColor(" hsl(200, 50%, 40%) ")).toBe("hsl(200, 50%, 40%)");
    expect(cssColor("oklch(0.7 0.1 200 / 50%)")).toBe("oklch(0.7 0.1 200 / 50%)");
  });

  it("refuses anything that could inject CSS", () => {
    for (const value of ["", "#12345", "#ggg", "red; x:y", "url(x)", "rgb(1,2,3);", "a"]) {
      expect(cssColor(value)).toBe("");
    }
  });
});

describe("monogram", () => {
  it("takes the first letters of the first two words, upper-cased", () => {
    expect(monogram("ai blog title generator")).toBe("AB");
    expect(monogram("  regex  ")).toBe("R");
    expect(monogram("")).toBe("");
  });
});
