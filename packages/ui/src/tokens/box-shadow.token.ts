import type { ColorMode } from './modes/color-mode';

/**
 * Elevation.
 *
 * Depth here is carried by the hairline border; the shadow only lifts a surface off the
 * page. That is why the dark values are so much simpler than the light ones — on a dark
 * ground a soft shadow is nearly invisible, and faking it with a bigger blur just smears
 * the edge. Dark mode leans on the border instead.
 */
export const boxShadow: Record<ColorMode, { none: string; sm: string; md: string }> = {
  light: {
    none: 'none',
    sm: '0 1px 2px rgba(16,24,40,0.05), 0 1px 3px rgba(16,24,40,0.06)',
    md: '0 2px 6px rgba(16,24,40,0.06), 0 6px 16px rgba(16,24,40,0.08)',
  },
  dark: {
    none: 'none',
    sm: '0 1px 2px rgba(0,0,0,0.5)',
    md: '0 4px 16px rgba(0,0,0,0.55)',
  },
};

export type Elevation = keyof (typeof boxShadow)['light'];

/** A focus ring, drawn as a shadow so it follows the element's own corner radius. */
export function focusRing(accent: string): string {
  return `0 0 0 1px ${accent}`;
}
