import type { Hue } from "../styles/tokens/palette.tokens";
import { roleVar } from "../styles/tokens/semantic.tokens";

/** The hue each freelance-gig category wears across the careers pages. */
const GIG_CATEGORY_HUES: Readonly<Record<string, Hue>> = {
  Development: "blue",
  Design: "pink",
  Writing: "violet",
  Video: "red",
  Data: "emerald",
  Marketing: "amber",
  "AI/ML": "indigo",
};

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
  const hue = GIG_CATEGORY_HUES[category];
  if (hue) {
    return { tint: roleVar(`${hue}-soft`), ink: roleVar(`${hue}-fg`), solid: roleVar(hue) };
  }
  return { tint: roleVar("surface-muted"), ink: roleVar("fg-muted"), solid: roleVar("fg-subtle") };
};
