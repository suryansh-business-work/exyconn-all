import { alpha } from '../../styles';
import { portalShadow } from '../box-shadow.token';
import { washCanvas } from '../canvas.token';
import {
  blue,
  blush,
  green,
  lavender,
  mist,
  orange,
  peach,
  red,
  sky,
  white,
} from '../colors.tokens';
import type { SemanticTokens } from './semantic-tokens';

/** Card glass: near-white, with a little of the wash showing through. */
const CARD_GLASS = 0.72;
/** The page frame: a lighter frost, so the cards on it still lift. */
const FRAME_GLASS = 0.4;
/** A field's well: whiter than a card, so a field on a card still reads as a well. */
const FIELD_GLASS = 0.85;
/** The topbar: frosted, but dense enough that ink scrolling under it cannot drag it below AA. */
const BAR_GLASS = 0.9;
/** The light catching a glass edge, and the inner highlight on the selected pill. */
const EDGE_LIGHT = 0.8;
const PILL_HIGHLIGHT = 0.9;
const PILL_SHADE = 0.12;

/**
 * Light mode: frosted white glass on a pastel wash — sky at the top-left, through lavender and
 * pink, to peach at the bottom-right — a deep navy ink, and the navy as the accent every
 * primary button and checked control wears. The current navigation row is a glossy sky pill.
 *
 * Text sits on the wash as well as on the cards, so every ink here is held to 4.5:1 on every
 * stop of it and on the glass composited over each — which is why the status hues run a step
 * darker than they would need to on white alone. Every status hue runs DARK here and LIGHT in
 * dark.token.ts; that inversion is the whole reason the two modes are separate files.
 */
export const lightTokens: SemanticTokens = {
  primary: mist[850],
  onPrimary: white,
  secondary: orange[900],
  success: green[900],
  warning: orange[950],
  error: red[950],
  info: blue[700],
  // The navigation sits on the canvas itself, as the topbar does: only the cards are lifted.
  background: { page: mist[75], panel: white, muted: mist[150], sidebar: mist[75] },
  text: { primary: mist[850], secondary: mist[600] },
  divider: mist[250],
  control: mist[500],
  ring: blue[700],
  shadow: portalShadow.light,
  canvas: washCanvas(mist[75], [sky[50], lavender[50], blush[50], peach[50]]),
  glass: {
    card: alpha(white, CARD_GLASS),
    frame: alpha(white, FRAME_GLASS),
    field: alpha(white, FIELD_GLASS),
    bar: alpha(mist[75], BAR_GLASS),
    edge: alpha(white, EDGE_LIGHT),
  },
  selected: {
    top: sky[100],
    bottom: sky[200],
    ink: mist[850],
    icon: sky[800],
    highlight: `inset 0 1px 0 ${alpha(white, PILL_HIGHLIGHT)}, 0 1px 2px ${alpha(sky[800], PILL_SHADE)}`,
  },
};
