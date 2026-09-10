/**
 * The type scale, in px.
 *
 * One scale serves text and icons: an icon set next to 14px text should be sized from the
 * same ladder, and giving icons a private scale is how a row ends up with a 17px glyph
 * beside a 14px label for no reason anybody can name.
 *
 * Dense steps at the bottom (10–14) are deliberate — this is operational chrome, where a
 * table row, a chip and an avatar initial all live below body size.
 */
export const fontSize = {
  '3xs': 10,
  '2xs': 11,
  xs: 12,
  sm: 13,
  md: 14,
  lg: 16,
  xl: 18,
  '2xl': 20,
  '3xl': 24,
  '4xl': 32,
  '5xl': 40,
  '6xl': 56,
} as const;

export type FontSize = keyof typeof fontSize;

/**
 * Icon sizes, as names pointing back into the same ladder. `sx={{ fontSize: iconSize.sm }}`
 * reads as an intent; `sx={{ fontSize: 14 }}` reads as a guess.
 */
export const iconSize = {
  xs: fontSize.xs,
  sm: fontSize.md,
  md: fontSize.lg,
  lg: fontSize.xl,
  xl: fontSize['2xl'],
  '2xl': fontSize['3xl'],
  '3xl': fontSize['4xl'],
  '4xl': fontSize['5xl'],
  '5xl': fontSize['6xl'],
} as const;

export type IconSize = keyof typeof iconSize;

/** Unitless line heights. Unitless so a nested element inherits a ratio, not a px height. */
export const lineHeight = {
  tight: 1.2,
  snug: 1.35,
  normal: 1.5,
  relaxed: 1.65,
} as const;

export type LineHeight = keyof typeof lineHeight;
