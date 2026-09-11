import { borderWidth } from './tokens/border.token';
import { boxShadow } from './tokens/box-shadow.token';
import type { CSSObject, Theme } from './styles';

/** The portal topbar's round buttons; the trackers' headers draw theirs a little larger. */
export const ROUND_BUTTON_SIZE = 40;

/**
 * A round paper button with a hairline — the header buttons of the trackers and the portal
 * topbar (theme switch, bells, account). Spread into an `sx` callback: `sx={(t) => roundButton(t)}`.
 */
export function roundButton(theme: Theme, size: number = ROUND_BUTTON_SIZE): CSSObject {
  return {
    width: size,
    height: size,
    borderRadius: '50%',
    color: theme.palette.text.primary,
    backgroundColor: theme.palette.background.paper,
    border: `${borderWidth.hairline}px solid ${theme.palette.divider}`,
    boxShadow: boxShadow[theme.palette.mode].sm,
  };
}
