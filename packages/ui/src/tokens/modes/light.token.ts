import { background } from '../backgrounds.token';
import { boxShadow } from '../box-shadow.token';
import { emerald, indigo, neutral, orange, red, white } from '../colors.tokens';
import type { SemanticTokens } from './semantic-tokens';

/**
 * Light mode: dark ink on a near-white ground.
 *
 * The status hues run DARK here (emerald 900, orange 800, red 900) because they are read
 * against white — the same green that is legible on the dark panel would be a 2:1 smear on
 * this one. That inversion is the whole reason the two modes are separate files.
 */
export const lightTokens: SemanticTokens = {
  primary: indigo[600],
  onPrimary: white,
  secondary: orange[500],
  success: emerald[900],
  warning: orange[800],
  error: red[900],
  background: { page: background.light.page, panel: background.light.panel },
  text: { primary: neutral[800], secondary: neutral[500] },
  divider: neutral[100],
  shadow: { sm: boxShadow.light.sm, md: boxShadow.light.md },
};
