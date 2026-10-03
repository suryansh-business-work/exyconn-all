import { alpha } from '../../styles';
import { portalShadow } from '../box-shadow.token';
import { amber, azure, green, mist, orange, red } from '../colors.tokens';
import type { SemanticTokens } from './semantic-tokens';

/** How far the hairline is lifted off a dark panel. A solid grey border reads as a seam. */
const DARK_DIVIDER_OPACITY = 0.08;

/**
 * Dark mode: the same layout at night — a deep navy-black canvas, cards one step up, and the
 * light-mode ink turned into the accent, so a primary button is a light pill with navy ink
 * exactly where light mode has a navy pill with white ink. The status hues are the light
 * shades of each family; every one clears 4.5:1 on the page and on a card.
 */
export const darkTokens: SemanticTokens = {
  primary: mist[100],
  onPrimary: mist[950],
  secondary: orange[200],
  success: green[200],
  warning: amber[300],
  error: red[300],
  info: azure[300],
  background: { page: mist[950], panel: mist[900], muted: mist[800], sidebar: mist[950] },
  text: { primary: mist[100], secondary: mist[400] },
  divider: alpha(mist[100], DARK_DIVIDER_OPACITY),
  control: mist[550],
  ring: mist[100],
  shadow: portalShadow.dark,
};
