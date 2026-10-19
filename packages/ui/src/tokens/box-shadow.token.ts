import { alpha } from '../styles';
import { black, night } from './colors.tokens';
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

/** One shadow colour at an opacity. Only this file composes a shadow colour. */
function shade(base: string, opacity: number): string {
  return alpha(base, opacity);
}

/**
 * Soft, wide, diffuse shadows: a faint contact shade under the edge and a long blur that lifts
 * frosted glass off the canvas without drawing a line round it. By day the shade is a navy tint
 * rather than black — a grey shadow on a pastel wash reads as dirt. Dark mode needs a denser
 * shade, because on a near-black ground a 10% shadow is not there.
 */
function shadowScale(base: string, faint: number, soft: number): ShadowScale {
  return {
    xs: `0 1px 2px 0 ${shade(base, faint)}`,
    sm: `0 1px 2px 0 ${shade(base, faint)}, 0 10px 30px -8px ${shade(base, soft)}`,
    md: `0 2px 6px -1px ${shade(base, faint)}, 0 18px 40px -12px ${shade(base, soft)}`,
    lg: `0 4px 10px -2px ${shade(base, faint)}, 0 28px 56px -14px ${shade(base, soft)}`,
    xl: `0 8px 18px -4px ${shade(base, faint)}, 0 40px 80px -16px ${shade(base, soft)}`,
  };
}

/**
 * The portals' elevation: a card sits at `sm`, a menu at `md`, a dialog at `lg`. The trackers
 * keep `boxShadow` above — this scale belongs to `createAppTheme` and the shell's surfaces.
 */
export const portalShadow: Record<ColorMode, ShadowScale> = {
  light: shadowScale(night[850], 0.05, 0.1),
  dark: shadowScale(black, 0.3, 0.5),
};
