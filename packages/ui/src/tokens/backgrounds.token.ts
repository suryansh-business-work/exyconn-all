import { alpha } from '../styles';
import { black, neutral, white } from './colors.tokens';
import type { ColorMode } from './modes/color-mode';

/**
 * Surfaces: what the page, a panel and a popover are painted with in each mode.
 *
 * `page` is one step below `panel` in both modes — that single step is what separates a
 * card from the ground it sits on, and it is why a panel needs no shadow to read as a panel.
 */
export const background: Record<ColorMode, { page: string; panel: string; raised: string }> = {
  light: { page: neutral[50], panel: white, raised: white },
  dark: { page: neutral[900], panel: neutral[800], raised: neutral[800] },
};

/**
 * How strongly an accent tints a surface behind it — a selected tile, a numbered step, a
 * status pill. Kept as opacities rather than as `${accent}14` hex suffixes: the suffix form
 * silently produces `#RRGGBB14` garbage the moment the accent is an `rgb()` or a CSS var.
 */
export const tintOpacity = { faint: 0.04, subtle: 0.08, soft: 0.12, strong: 0.2 } as const;

export type TintLevel = keyof typeof tintOpacity;

/** An accent, thinned to a background wash. */
export function tint(base: string, level: TintLevel = 'subtle'): string {
  return alpha(base, tintOpacity[level]);
}

/**
 * Scrims — anything that dims what is behind it: a lightbox backdrop, the caption bar over a
 * photograph, the hover state of a control that floats on an image.
 *
 * A scrim is black at an opacity, never a grey: over an unknown photograph a solid grey is
 * sometimes lighter than what it covers, and the white text on top disappears.
 */
export const scrimOpacity = { light: 0.45, base: 0.6, heavy: 0.7 } as const;

export type ScrimLevel = keyof typeof scrimOpacity;

/** Black at one of the scrim opacities. */
export function scrim(level: ScrimLevel = 'base'): string {
  return alpha(black, scrimOpacity[level]);
}

/** Ink that sits ON a scrim. Always white: the scrim guarantees the ground beneath it. */
export const onScrim = white;
