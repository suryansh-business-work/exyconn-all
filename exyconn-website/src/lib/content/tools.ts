/**
 * Tools directory shaping: the catalogue grouped by the portal's categories, a safe accent
 * colour per tool (admins type any colour) and the cube scene's count. The page copy is the
 * CMS's (components tools.list / tools.detail).
 */
import type { Tool, ToolCategory } from "../portal/types";

export const MAX_CUBES = 12;

export interface ToolEntry {
  tool: Tool;
  category: ToolCategory;
}

export interface Catalogue {
  /** Categories with at least one tool, in the portal's order, with their counts. */
  categories: { category: ToolCategory; count: number }[];
  /** Every tool whose category is published, by category order then tool order. */
  entries: ToolEntry[];
}

export const toolCatalogue = (
  categories: readonly ToolCategory[],
  tools: readonly Tool[]
): Catalogue => {
  const ordered = categories.toSorted((a, b) => a.order - b.order);
  const entries = ordered.flatMap((category) =>
    tools
      .filter((tool) => tool.categorySlug === category.slug)
      .toSorted((a, b) => a.order - b.order)
      .map((tool) => ({ tool, category }))
  );
  return {
    categories: ordered
      .map((category) => ({
        category,
        count: entries.filter((entry) => entry.category.slug === category.slug).length,
      }))
      .filter(({ count }) => count > 0),
    entries,
  };
};

/** Cubes for the scene: one per tool, at most 12; undefined (the generic six) when empty. */
export const cubeCount = (tools: number): number | undefined =>
  tools > 0 ? Math.min(MAX_CUBES, tools) : undefined;

const HEX = /^#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i;
const FUNCTIONAL = /^(?:rgba?|hsla?|oklch|oklab)\([\d\s.,%/+-]+\)$/i;
const NAMED = /^[a-z]{3,20}$/i;

/** The value when it is a plain CSS colour (hex, an rgb/hsl/oklch function, a name); otherwise "". */
export const cssColor = (value: string): string => {
  const trimmed = value.trim();
  return HEX.test(trimmed) || FUNCTIONAL.test(trimmed) || NAMED.test(trimmed) ? trimmed : "";
};

/** "AB" from "AI blog title generator" — the tool's mark in place of an icon font. */
export const monogram = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
