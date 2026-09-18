import { alpha } from '../../styles';
import { portalShadow } from '../box-shadow.token';
import { amber, azure, emerald, orange, red, white, zinc } from '../colors.tokens';
import type { SemanticTokens } from './semantic-tokens';

/** How far the hairline is lifted off a dark panel. A solid grey border reads as a seam. */
const DARK_DIVIDER_OPACITY = 0.1;

/**
 * Dark mode: shadcn/ui's zinc theme — light ink and a near-white primary on near-black.
 *
 * Every status hue is a light shade of its family, and `onPrimary` is dark. `secondary` is
 * the brand orange itself: it clears 4.5:1 on the dark grounds, where on the light ones it
 * does not (see light.token.ts). The panel is one step up from the page, as in shadcn v4, so
 * a card still reads as a card where a shadow cannot be seen.
 */
export const darkTokens: SemanticTokens = {
  primary: zinc[50],
  onPrimary: zinc[900],
  secondary: orange[500],
  success: emerald[300],
  warning: amber[300],
  error: red[300],
  info: azure[300],
  background: { page: zinc[950], panel: zinc[900], muted: zinc[800], sidebar: zinc[900] },
  text: { primary: zinc[50], secondary: zinc[400] },
  divider: alpha(white, DARK_DIVIDER_OPACITY),
  control: zinc[500],
  ring: zinc[300],
  shadow: portalShadow.dark,
};
