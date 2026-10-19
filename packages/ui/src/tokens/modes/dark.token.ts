import { alpha } from '../../styles';
import { portalShadow } from '../box-shadow.token';
import { glowCanvas } from '../canvas.token';
import {
  amber,
  azure,
  blush,
  green,
  lavender,
  mist,
  night,
  orange,
  peach,
  red,
  sky,
  white,
} from '../colors.tokens';

import type { SemanticTokens } from './semantic-tokens';

/** How far the hairline is lifted off a dark panel. A solid grey border reads as a seam. */
const DARK_DIVIDER_OPACITY = 0.08;
/** Card glass: dark indigo, translucent enough for the glows to warm it. */
const CARD_GLASS = 0.66;
const FRAME_GLASS = 0.5;
/** A field's well: a faint wash of its own edge colour. */
const FIELD_GLASS = 0.2;
/** The topbar: dense enough that light ink scrolling under it cannot drag it below AA. */
const BAR_GLASS = 0.9;
const EDGE_LIGHT = 0.1;
const PILL_HIGHLIGHT = 0.12;

/**
 * Dark mode: a deep navy canvas with faint pastel glows in its corners, dark translucent glass
 * cards, and the light-mode ink turned into the accent, so a primary button is a light pill
 * with navy ink exactly where light mode has a navy pill with white ink. The status hues are
 * the light shades of each family; every one clears 4.5:1 on the canvas, its glows and a card.
 */
export const darkTokens: SemanticTokens = {
  primary: mist[100],
  onPrimary: mist[950],
  secondary: orange[200],
  success: green[200],
  warning: amber[300],
  error: red[300],
  info: azure[300],
  background: { page: night[950], panel: night[900], muted: night[800], sidebar: night[950] },
  text: { primary: night[100], secondary: night[400] },
  divider: alpha(night[100], DARK_DIVIDER_OPACITY),
  control: night[500],
  ring: sky.ice,
  shadow: portalShadow.dark,
  canvas: glowCanvas(night[950], [
    { color: sky.glow, opacity: 0.16, at: '0% 0%' },
    { color: lavender.glow, opacity: 0.13, at: '100% 20%' },
    { color: blush.glow, opacity: 0.1, at: '100% 100%' },
    { color: peach.glow, opacity: 0.08, at: '0% 100%' },
  ]),
  glass: {
    card: alpha(night[850], CARD_GLASS),
    frame: alpha(night[900], FRAME_GLASS),
    field: alpha(night[500], FIELD_GLASS),
    bar: alpha(night[950], BAR_GLASS),
    edge: alpha(white, EDGE_LIGHT),
  },
  selected: {
    top: sky.dusk,
    bottom: sky.deep,
    ink: night[100],
    icon: sky.ice,
    highlight: `inset 0 1px 0 ${alpha(white, PILL_HIGHLIGHT)}`,
  },
};
