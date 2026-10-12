/**
 * exyconn.com's colour ramps exactly as exyconn-website/src/styles/tokens/palette.tokens.ts
 * defines them, so the design system carries every colour its roles point at (var(--palette-…))
 * and a canvas or another renderer resolves them without the website's own stylesheet.
 * The ramps themselves are data: palette.json beside this module.
 */
import palette from './palette.json';

export const EXYCONN_PALETTE: Record<string, string> = palette;
