import { roundButton as roundSurface } from '@exyconn/ui';
import type { CSSObject, Theme } from '@exyconn/ui';
import { NO_DRAG } from './window-drag';

/** The tracker header's round buttons: a size up from the portal's, for a touch-sized window. */
const ROUND_BUTTON_SIZE = 44;

/** A round paper button beside the page title — the design system's, opted out of the drag bar. */
export function roundButton(theme: Theme): CSSObject {
  return { ...NO_DRAG, ...roundSurface(theme, ROUND_BUTTON_SIZE) };
}
