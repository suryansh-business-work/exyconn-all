/**
 * Type: the family, the weights and the tracking. Sizes live in `font-size.token.ts`.
 */

/**
 * Inter, with a system fallback that looks like it on every platform.
 *
 * Chosen over Nunito for what this portal actually is: dense operational chrome — long
 * sidebars, wide grids, columns of money. Nunito's rounded terminals read as friendly at
 * poster sizes and as mush at 13px in a table. Inter was drawn for interface text at small
 * sizes and ships the tabular figures the finance screens need.
 */
export const fontFamily = {
  sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, system-ui, sans-serif',
  /** The desktop tracker ships no webfont — it paints with whatever the OS already has. */
  system: '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif',
} as const;

/**
 * The three weights the whole system is allowed to use. A step lighter than they once were:
 * at 800 every heading and every button shouted, which left nothing louder to mark the thing
 * that mattered. `createAppTheme` reads these — the theme and the tokens cannot drift.
 */
export const fontWeight = { regular: 400, medium: 500, semibold: 600, bold: 700 } as const;

export type FontWeight = keyof typeof fontWeight;

/** Letter spacing. Negative tightens display type; positive opens up small caps. */
export const letterSpacing = {
  tighter: '-0.02em',
  tight: '-0.015em',
  snug: '-0.01em',
  normal: '0',
  wide: '0.06em',
} as const;

/**
 * Money and any column of digits. Proportional figures make a total column look ragged.
 * Applied as `fontVariantNumeric`.
 */
export const numeric = { tabular: "'tabular-nums' 1" } as const;
