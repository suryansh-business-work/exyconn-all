import { portalShadow } from '../box-shadow.token';
import { blue, emerald, orange, red, white, zinc } from '../colors.tokens';
import type { SemanticTokens } from './semantic-tokens';

/**
 * Light mode: shadcn/ui's zinc theme — near-black ink and a near-black primary on white.
 *
 * The status hues run DARK here (emerald 900, orange 800, red 900) because they are read
 * against white — the same green that is legible on the dark panel would be a 2:1 smear on
 * this one. That inversion is the whole reason the two modes are separate files.
 *
 * `secondary` is orange 800 for the same reason. The brand orange (500) measures 2.4:1 on
 * white — it was believed to pass, and nothing checked; `contrast.test.ts` now does.
 */
export const lightTokens: SemanticTokens = {
  primary: zinc[900],
  onPrimary: zinc[50],
  secondary: orange[800],
  success: emerald[900],
  warning: orange[800],
  error: red[900],
  info: blue[600],
  background: { page: white, panel: white, muted: zinc[100], sidebar: zinc[50] },
  text: { primary: zinc[950], secondary: zinc[550] },
  divider: zinc[200],
  control: zinc[450],
  ring: zinc[950],
  shadow: portalShadow.light,
};
