import { palette } from "./palette.tokens";

/**
 * The brand colours as literal values, for the handful of places that cannot use a CSS
 * variable: `<meta name="theme-color">`, the branding fallback, anything read by
 * TypeScript rather than painted by the browser. Read straight from the palette, so there
 * is no second copy to drift.
 */
export const brandFallback = {
  primary: palette.brand[500],
  secondary: palette.purple[600],
  accent: palette.cyan[500],
  background: palette.base.white,
  text: palette.gray[900],
} as const;
