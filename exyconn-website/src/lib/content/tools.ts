/**
 * Tools directory shaping: the catalogue grouped by the portal's categories, a safe accent
 * colour per tool (admins type any colour), the cube scene's count, and the page copy.
 */
import type { Tool, ToolCategory } from "../portal/types";
import { TOOLS_SITE_URL } from "../site";

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

export const TOOLS_COPY = {
  title: "Tools | Exyconn",
  description: "Every tool Exyconn builds and maintains, grouped by what it is for.",
  crumb: "Tools",
  heading: "Free tools we build and maintain",
  lede: "Small, focused tools for writing, building and branding — grouped by what they are for.",
  countTemplate: "{shown} of {total} tools",
  stats: "{tools} tools · {categories} categories",
  early: "{count} in early release",
  filterLabel: "Filter tools",
  sheetLabel: "Categories",
  categoryLabel: "Category",
  all: "All",
  searchLabel: "Search tools",
  searchPlaceholder: "Name or purpose",
  chapterLabel: "Directory",
  chapterTitle: "Pick a tool, open it, done",
  mvp: "Early release",
  details: "Details",
  open: "Open tool",
  opensApp: "(opens tools.exyconn.com)",
  noMatch: "No tool matches those filters.",
  emptyLabel: "Nothing published yet",
  emptyTitle: "The directory is being stocked",
  emptyText:
    "Tools appear here as they are published. The tools app already runs everything we have built.",
  emptyPrimary: { label: "Open the tools app", href: TOOLS_SITE_URL, external: true },
  emptySecondary: { label: "Our services", href: "/services" },
  appLink: { label: "Browse the tools app", href: TOOLS_SITE_URL, external: true },
  ctaLabel: "Need something bespoke?",
  ctaTitle: "Need a tool built for your team?",
  ctaText: "We build internal tools and SaaS products end to end.",
  ctaPrimary: { label: "Request a tool", href: "/contact" },
  ctaSecondary: { label: "Software as a service", href: "/services/software-as-a-service" },
} as const;

export const TOOL_COPY = {
  home: "Home",
  list: "Tools",
  open: "Open tool",
  details: "Details",
  previewLabel: "Where it runs",
  about: "About this tool",
  features: "What it does",
  useCases: "Where people use it",
  pricing: "Pricing",
  related: "More in this category",
  mvp: "Early release",
  back: "All tools",
  ctaLabel: "Need something bespoke?",
  ctaTitle: "Need a tool built for your team?",
  ctaPrimary: { label: "Request a tool", href: "/contact" },
  ctaSecondary: { label: "All tools", href: "/our-tools" },
} as const;
