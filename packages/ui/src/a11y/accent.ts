import type { Theme } from '../styles';
import { AA_LARGE, AA_TEXT, ensureContrast } from './contrast';

/** What an accent is painting: words (4.5:1), or an icon, edge or mark (3:1). */
export type AccentUse = 'text' | 'graphic';

const REQUIRED_RATIO: Record<AccentUse, number> = { text: AA_TEXT, graphic: AA_LARGE };

/**
 * A categorical accent — a module's, a pipeline stage's, a ticket type's — made readable in
 * the current mode.
 *
 * These accents are identities picked from the colour ramps, and a ramp shade that reads on
 * one ground rarely reads on the other: amber 500 is 2.2:1 on white. The hue is kept and only
 * the lightness moves, and only as far as WCAG AA needs (SC 1.4.3 for text, SC 1.4.11 for
 * icons and edges), so an accent that already passes comes back unchanged.
 *
 * `background` defaults to the panel. On a tinted surface pass `background.muted`: it is
 * darker than any light tint and lighter than any dark one, so it is the conservative ground.
 */
export function readableAccent(
  accent: string,
  theme: Theme,
  use: AccentUse = 'text',
  background: string = theme.palette.background.paper,
): string {
  return ensureContrast(accent, background, REQUIRED_RATIO[use]);
}
