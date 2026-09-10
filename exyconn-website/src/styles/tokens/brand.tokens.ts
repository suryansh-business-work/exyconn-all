/**
 * The brand colours as literal hex, for the handful of places that cannot use a CSS
 * variable: `<meta name="theme-color">`, an og:image generator, anything read by TypeScript
 * rather than painted by the browser.
 *
 * These MUST equal their ramp entries in `colors.tokens.scss` — that file stays the source
 * of truth for the site's colour, and `tests/tokens.test.ts` fails the build if the two
 * drift. Do not add a value here that has no ramp entry.
 */
export const brandFallback = {
  /** `--palette-brand-500` */
  primary: "#0071e3",
  /** `--palette-purple-500` */
  secondary: "#9333ea",
  /** `--palette-cyan-500` */
  accent: "#06b6d4",
  /** `--palette-neutral-0` */
  background: "#ffffff",
  /** `--palette-gray-900` */
  text: "#111827",
} as const;
