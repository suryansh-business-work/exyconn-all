import { alpha } from '../../styles';
import { background } from '../backgrounds.token';
import { boxShadow } from '../box-shadow.token';
import { amber, emerald, indigo, neutral, orange, red, white } from '../colors.tokens';
import type { SemanticTokens } from './semantic-tokens';

/** How far the hairline is lifted off a dark panel. A solid grey border reads as a seam. */
const DARK_DIVIDER_OPACITY = 0.1;

/**
 * Dark mode: light ink on a near-black ground.
 *
 * Every status hue is a light shade of its family, and `onPrimary` is dark — see the note
 * on `SemanticTokens.onPrimary`. `secondary` is the one value shared with light mode: the
 * brand orange sits at 4.5:1 on both grounds, so it does not need a second version.
 */
export const darkTokens: SemanticTokens = {
  primary: indigo[200],
  onPrimary: neutral[900],
  secondary: orange[500],
  success: emerald[300],
  warning: amber[300],
  error: red[300],
  background: { page: background.dark.page, panel: background.dark.panel },
  text: { primary: neutral[100], secondary: neutral[300] },
  divider: alpha(white, DARK_DIVIDER_OPACITY),
  shadow: { sm: boxShadow.dark.sm, md: boxShadow.dark.md },
};
