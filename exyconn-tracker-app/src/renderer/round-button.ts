import { borderWidth, boxShadow } from '@exyconn/ui';
import type { CSSObject, Theme } from '@exyconn/ui';
import { NO_DRAG } from './window-drag';

/** The size of the header's round buttons. */
export const ROUND_BUTTON_SIZE = 44;

/** A round paper button beside the page title, as the header draws them. */
export function roundButton(theme: Theme): CSSObject {
  return {
    ...NO_DRAG,
    width: ROUND_BUTTON_SIZE,
    height: ROUND_BUTTON_SIZE,
    borderRadius: '50%',
    color: theme.palette.text.primary,
    backgroundColor: theme.palette.background.paper,
    border: `${borderWidth.hairline}px solid ${theme.palette.divider}`,
    boxShadow: theme.palette.mode === 'dark' ? boxShadow.dark.none : boxShadow.light.sm,
  };
}
