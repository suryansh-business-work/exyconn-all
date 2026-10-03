import { portalShadow } from '../box-shadow.token';
import { blue, green, mist, orange, red, white } from '../colors.tokens';
import type { SemanticTokens } from './semantic-tokens';

/**
 * Light mode: white cards on a soft cool-grey canvas, a deep navy ink, and the navy as the
 * one accent every primary button, current tab and checked control wears. The brand orange
 * is identity only.
 *
 * Text sits on the grey page as well as on the white cards, so every ink here is held to
 * 4.5:1 on BOTH — which is why the status hues are a step darker than they would need to be
 * on white alone. Every status hue runs DARK here and LIGHT in dark.token.ts; that inversion
 * is the whole reason the two modes are separate files.
 */
export const lightTokens: SemanticTokens = {
  primary: mist[850],
  onPrimary: white,
  secondary: orange[900],
  success: green[900],
  warning: orange[800],
  error: red[950],
  info: blue[700],
  // The navigation sits on the canvas itself, as the topbar does: only the cards are lifted.
  background: { page: mist[100], panel: white, muted: mist[200], sidebar: mist[100] },
  text: { primary: mist[850], secondary: mist[600] },
  divider: mist[250],
  control: mist[500],
  ring: mist[850],
  shadow: portalShadow.light,
};
