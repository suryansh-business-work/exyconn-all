import { alpha } from '../../styles';
import { portalShadow } from '../box-shadow.token';
import { fuchsia, green, red, sky, white, yellow, onyx } from '../colors.tokens';
import type { SemanticTokens } from './semantic-tokens';

/** How far the hairline is lifted off a dark panel. A solid grey border reads as a seam. */
const DARK_DIVIDER_OPACITY = 0.1;

/**
 * Dark mode: the reference's node canvas — #0D0D0D page, a panel one step up, white ink,
 * and the three accents worn exactly as drawn, because every one of them clears 4.5:1 here
 * (blue 9:1, pink 7:1, yellow 17:1). The ring is the yellow: it is the highlight the
 * reference puts around the selected node, and it stands out on every ground at 14:1.
 */
export const darkTokens: SemanticTokens = {
  primary: sky[300],
  onPrimary: onyx[950],
  secondary: fuchsia[300],
  success: green[200],
  warning: yellow[300],
  error: red[300],
  info: sky[300],
  background: { page: onyx[950], panel: onyx[900], muted: onyx[800], sidebar: onyx[925] },
  text: { primary: white, secondary: onyx[400] },
  divider: alpha(white, DARK_DIVIDER_OPACITY),
  control: onyx[550],
  ring: yellow[300],
  shadow: portalShadow.dark,
};
