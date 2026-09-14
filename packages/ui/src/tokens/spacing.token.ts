/** The 8px rhythm every gap, pad and inset is a multiple of. */
export const SPACING_UNIT = 8;

/** Returns `factor * SPACING_UNIT` as a raw px number (e.g. `spacing(2)` -> 16). */
export function spacing(factor: number): number {
  return factor * SPACING_UNIT;
}

/**
 * The only steps a gap, pad, inset or margin may take, as MUI spacing factors.
 *
 * The unit is 8px with one half-step at 4px, which is what makes 1.5 (12px) legal and 1.25
 * (10px) not. Six steps is deliberately few: this is dense chrome, and a scale with a value
 * every 2px stops being a scale — the portal drifted to eleven of them, so the same list row
 * was 10px from its neighbour in HR and 12px in Projects, and nobody could say which was right.
 *
 * | Step | px | Where it belongs |
 * | --- | --- | --- |
 * | 0.5 | 4  | Inside a control: an icon from its label, a chip from the next chip |
 * | 1   | 8  | Between the parts of one row |
 * | 1.5 | 12 | Between cards, and a card's own padding — the portal's default rhythm |
 * | 2   | 16 | A panel's padding, the page gutter |
 * | 3   | 24 | Between sections of a page |
 * | 4   | 32 | Around something standing on its own, like an empty state |
 *
 * Enforced by `packages/shell/__tests__/unit-tests/spacingScale.test.ts`, which reads every
 * portal source: a value off this scale fails the build rather than the review.
 */
export const SPACING_STEPS = [0.5, 1, 1.5, 2, 3, 4] as const;

export type SpacingStep = (typeof SPACING_STEPS)[number];
