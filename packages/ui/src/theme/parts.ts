import { alpha, type Components, type Theme } from '../styles';
import { tintOpacity } from '../tokens/backgrounds.token';
import { BASE_RADIUS, CARD_RADIUS, borderWidth, radius } from '../tokens/border.token';
import { spacing } from '../tokens/spacing.token';
import type { ColorMode, SemanticTokens } from '../tokens/modes';

/** What every component group is built from: the mode, and that mode's semantic tokens. */
export interface ThemeParts {
  mode: ColorMode;
  t: SemanticTokens;
}

/** A group of MUI component overrides — one file per family keeps `createAppTheme` a table. */
export type ComponentGroup = Components<Omit<Theme, 'components'>>;

/**
 * Touch, asked properly.
 *
 * A thumb needs about 44px; a mouse pointer does not, and this is dense, data-heavy chrome
 * that a desk user wants to see a lot of at once. So the density stays where there is a
 * pointer and every target grows where there is a finger — which is what `pointer: coarse`
 * asks, rather than guessing from the width of the window.
 */
export const TOUCH = '@media (pointer: coarse)';
export const TOUCH_TARGET = spacing(5.5);

/** A phone: where a dialog stops being a dialog and becomes the screen. */
export const PHONE = '@media (max-width: 599.95px)';

export const HAIRLINE = `${borderWidth.hairline}px solid`;

/** Corners as px strings — a bare number in a style override would be read as px anyway, but
 * the same number in `sx` multiplies the theme radius, so the portals always spell the unit. */
export const CONTROL_CORNER = `${BASE_RADIUS}px`;
export const CARD_CORNER = `${CARD_RADIUS}px`;
/** A row inside a padded menu or list — shadcn/ui's `rounded-sm`. */
export const INNER_CORNER = `${radius.sm}px`;
export const PILL = `${radius.pill}px`;

/** A disabled control — shadcn/ui's `disabled:opacity-50`. Exempt from contrast (SC 1.4.3). */
export const DISABLED_OPACITY = 0.5;

/** How much of the primary a filled button keeps on hover — shadcn/ui's `bg-primary/90`. */
export const HOVER_FILL_OPACITY = 0.9;

/**
 * The soft halo around a focused text field — shadcn/ui's `ring-[3px] ring-ring/20`. It sits on
 * top of the field's edge turning to the ring colour, which is the part that carries the 3:1.
 */
export function halo(colour: string): string {
  return `0 0 0 ${borderWidth.accent}px ${alpha(colour, tintOpacity.strong)}`;
}
