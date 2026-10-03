import type { Hue } from "../styles/tokens/palette.tokens";
import { roleVar } from "../styles/tokens/semantic.tokens";

/**
 * The one map of freelance-gig categories the careers pages share: the order they are listed
 * in and the hue each wears. A category the portal adds later (or "Other") is still listed —
 * after these, alphabetically — and painted neutral, so no gig is ever counted but not shown.
 */
const GIG_CATEGORY_HUES: ReadonlyMap<string, Hue | null> = new Map<string, Hue | null>([
  ["Development", "blue"],
  ["Design", "pink"],
  ["Writing", "violet"],
  ["Marketing", "amber"],
  ["Video", "red"],
  ["Data", "emerald"],
  ["AI/ML", "indigo"],
  ["Other", null],
]);

export interface GigCategoryColors {
  /** Background of the category chip and icon tile. */
  tint: string;
  /** The category name and icon drawn on that tint. */
  ink: string;
  /** A solid fill that carries white text — the large icon on a gig's own page. */
  solid: string;
}

/** Categories without a hue of their own ("Other", anything new) are painted neutral. */
export const gigCategoryColors = (category: string): GigCategoryColors => {
  const hue = GIG_CATEGORY_HUES.get(category);
  if (hue) {
    return { tint: roleVar(`${hue}-soft`), ink: roleVar(`${hue}-fg`), solid: roleVar(hue) };
  }
  return { tint: roleVar("surface-muted"), ink: roleVar("fg-muted"), solid: roleVar("fg-subtle") };
};

const KNOWN_ORDER = [...GIG_CATEGORY_HUES.keys()];

/** Sort key: the map's order, then any other category alphabetically. */
const compareCategories = (a: string, b: string): number => {
  const rank = (category: string) => {
    const index = KNOWN_ORDER.indexOf(category);
    return index === -1 ? KNOWN_ORDER.length : index;
  };
  return rank(a) - rank(b) || a.localeCompare(b);
};

export interface GigCategoryGroup<T> {
  category: string;
  items: T[];
}

/** Every item under its category, categories in list order. Each item appears exactly once. */
export const groupByGigCategory = <T extends { category: string }>(
  items: readonly T[]
): GigCategoryGroup<T>[] => {
  const groups = new Map<string, T[]>();
  items.forEach((item) => groups.set(item.category, [...(groups.get(item.category) ?? []), item]));
  return [...groups.entries()]
    .toSorted(([a], [b]) => compareCategories(a, b))
    .map(([category, grouped]) => ({ category, items: grouped }));
};
