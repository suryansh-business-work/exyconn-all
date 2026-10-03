/**
 * Type: the family, the weights and the tracking. Sizes live in `font-size.token.ts`.
 */

/**
 * Inter, with a system fallback on every platform.
 *
 * The portals bundle its variable build (@fontsource-variable/inter, imported once by the
 * shell's app root), so "Inter Variable" is what the browser finds; the plain name is for
 * anywhere it was installed by hand. A quiet grotesk with tabular figures, so the finance
 * screens' columns line up, and the same face the trackers wear.
 */
export const fontFamily = {
  sans: '"Inter Variable", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, system-ui, sans-serif',
  /** The desktop tracker bundles Inter's variable build (@fontsource-variable/inter). */
  tracker:
    '"Inter Variable", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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
