import { alpha } from '../styles';
import { black } from './colors.tokens';
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

/** The five steps of the portals' shadow scale — shadcn/ui's, which are Tailwind's. */
export interface ShadowScale {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

/** One black shadow at an opacity. Only this file composes a shadow colour. */
function shade(opacity: number): string {
  return alpha(black, opacity);
}

/**
 * Tailwind's shadow geometry at two strengths. The soft pair is Tailwind's own (5% / 10%);
 * dark mode needs a denser shade, because on a near-black ground a 10% shadow is not there.
 */
function shadowScale(faint: number, soft: number): ShadowScale {
  return {
    xs: `0 1px 2px 0 ${shade(faint)}`,
    sm: `0 1px 3px 0 ${shade(soft)}, 0 1px 2px -1px ${shade(soft)}`,
    md: `0 4px 6px -1px ${shade(soft)}, 0 2px 4px -2px ${shade(soft)}`,
    lg: `0 10px 15px -3px ${shade(soft)}, 0 4px 6px -4px ${shade(soft)}`,
    xl: `0 20px 25px -5px ${shade(soft)}, 0 8px 10px -6px ${shade(soft)}`,
  };
}

/**
 * The portals' elevation: a card sits at `sm`, a menu at `md`, a dialog at `lg`. The trackers
 * keep `boxShadow` above — this scale belongs to `createAppTheme` and the shell's surfaces.
 */
export const portalShadow: Record<ColorMode, ShadowScale> = {
  light: shadowScale(0.05, 0.1),
  dark: shadowScale(0.3, 0.45),
};
