import { alpha, type Components, type CSSObject, type Theme } from '../styles';
import { tintOpacity } from '../tokens/backgrounds.token';
import {
  BASE_RADIUS,
  CARD_RADIUS,
  DIALOG_RADIUS,
  FLOATING_RADIUS,
  borderWidth,
  radius,
} from '../tokens/border.token';
import { GLASS_BLUR, SOLID_SURFACES } from '../tokens/canvas.token';
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
export const FLOATING_CORNER = `${FLOATING_RADIUS}px`;
export const DIALOG_CORNER = `${DIALOG_RADIUS}px`;
/** Buttons, chips, tabs, badges, tracks: fully round ends. */
export const PILL_CORNER = `${radius.pill}px`;
/** Icon buttons, avatars and thumbs: circles. */
export const ROUND = '50%';
/** A row inside a padded menu or list, and a tooltip: a step inside the floating corner. */
export const INNER_CORNER = `${radius.md}px`;

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

/**
 * Frosted glass: the translucent card fill, the frost, a light edge and the soft card shadow.
 * Where a person has asked for less transparency or more contrast it is the solid panel with a
 * real divider instead — the same surface, minus the effect.
 */
export function glassCard(t: SemanticTokens): CSSObject {
  return {
    backgroundColor: t.glass.card,
    backdropFilter: GLASS_BLUR,
    WebkitBackdropFilter: GLASS_BLUR,
    border: `${HAIRLINE} ${t.glass.edge}`,
    boxShadow: t.shadow.sm,
    [SOLID_SURFACES]: {
      backgroundColor: t.background.panel,
      backdropFilter: 'none',
      WebkitBackdropFilter: 'none',
      borderColor: t.divider,
    },
  };
}

/** The glossy pastel pill a current navigation row or selected list row wears. */
export function selectedPill(t: SemanticTokens): CSSObject {
  return {
    backgroundColor: t.selected.bottom,
    backgroundImage: `linear-gradient(180deg, ${t.selected.top}, ${t.selected.bottom})`,
    color: t.selected.ink,
    boxShadow: t.selected.highlight,
  };
}
