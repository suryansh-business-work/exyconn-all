import { portalShadow } from '../box-shadow.token';
import { fuchsia, green, onyx, orange, red, sky, white } from '../colors.tokens';
import type { SemanticTokens } from './semantic-tokens';

/**
 * Light mode: the reference's white ground with the same accents taken down to shades that
 * read on it. The reference's blue (#6DB5FF) measures 2.3:1 on white and its pink 2.5:1 —
 * fine as a cursor label, unreadable as a button — so each has a 700 step that clears 4.5:1
 * and keeps the hue. The yellow cannot be made to read on white at all, so the warning hue
 * here is the orange that always was.
 *
 * Every status hue runs DARK here and LIGHT in dark.token.ts; that inversion is the whole
 * reason the two modes are separate files.
 */
export const lightTokens: SemanticTokens = {
  primary: sky[700],
  onPrimary: white,
  secondary: fuchsia[700],
  success: green[650],
  warning: orange[800],
  error: red[900],
  info: sky[700],
  background: { page: white, panel: white, muted: onyx[100], sidebar: onyx[50] },
  text: { primary: onyx[950], secondary: onyx[600] },
  divider: onyx[200],
  control: onyx[500],
  ring: onyx[950],
  shadow: portalShadow.light,
};
