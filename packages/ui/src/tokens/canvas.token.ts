import { alpha } from '../styles';
import { AA_LARGE, blend, ensureContrast } from '../a11y/contrast';
import type { ColorMode } from './modes/color-mode';

/**
 * The canvas and the frosted glass laid on it.
 *
 * The portals sit on a soft pastel wash — sky, lavender, pink and peach by day, faint glows on
 * a navy night — and their cards, frame and topbar are translucent glass over it. Glass has no
 * colour of its own, so every surface here also says which flat colours it can turn into: the
 * contrast tests check text against each of them, never against the blur.
 */

/** What a canvas is: a solid ground, the wash painted over it, and every flat colour the wash
 * passes through — the grounds text on the canvas has to read against. */
export interface Canvas {
  ground: string;
  image: string;
  stops: readonly string[];
}

/** One coloured glow on a dark canvas: a hue at an opacity, centred somewhere on the screen. */
export interface CanvasGlow {
  color: string;
  opacity: number;
  /** A CSS `<position>`, e.g. `'0% 0%'` for the top-left corner. */
  at: string;
}

/** The wash runs from the top-left corner to the bottom-right, as light falls on a desk. */
const WASH_ANGLE = 135;
/** How far a glow reaches before it fades to nothing. */
const GLOW_SIZE = '55% 55%';

/**
 * A light canvas: one diagonal gradient through the stops, evenly spaced. Text reads against
 * the ground (shown wherever the wash is switched off) and every stop.
 */
export function washCanvas(ground: string, stops: readonly string[]): Canvas {
  const last = stops.length - 1;
  const steps = stops.map((stop, index) => `${stop} ${Math.round((index / last) * 100)}%`);
  return {
    ground,
    image: `linear-gradient(${WASH_ANGLE}deg, ${steps.join(', ')})`,
    stops: [ground, ...stops],
  };
}

/**
 * A dark canvas: faint radial glows over the ground. Each glow's flat colour at its brightest
 * (its centre) is a stop; where two glows meet they are fainter than either centre.
 */
export function glowCanvas(ground: string, glows: readonly CanvasGlow[]): Canvas {
  return {
    ground,
    image: glows
      .map(
        ({ color, opacity, at }) =>
          `radial-gradient(${GLOW_SIZE} at ${at}, ${alpha(color, opacity)}, transparent 70%)`,
      )
      .join(', '),
    stops: [ground, ...glows.map(({ color, opacity }) => blend(color, ground, opacity))],
  };
}

/**
 * The frosted-glass fills, per mode — each a translucent colour the contrast tests composite
 * over every canvas stop.
 */
export interface GlassTokens {
  /** A card or panel. */
  card: string;
  /** The large frame the page content sits in. */
  frame: string;
  /** A text field's well: light glass, so a field reads on the canvas as well as on a card. */
  field: string;
  /** The topbar. Opaque enough that text scrolling beneath it never costs the bar its contrast. */
  bar: string;
  /** The hairline round a glass surface: light catching its edge. */
  edge: string;
}

/** The frost itself. Cosmetic only: no contrast in the system depends on it. */
export const GLASS_BLUR = 'blur(20px) saturate(160%)';

/**
 * Where a person has asked for less transparency or more contrast, glass turns solid: the
 * card is its opaque panel colour, the edge a real divider, and no blur is drawn.
 */
export const SOLID_SURFACES =
  '@media (prefers-reduced-transparency: reduce), (prefers-contrast: more)';

/** How strongly an accent tints its icon bubble, and the soft ring round it, per mode. */
const BUBBLE = {
  light: { fill: 0.14, ring: 0.22 },
  dark: { fill: 0.22, ring: 0.32 },
} as const;

/** A pastel bubble's three colours: its fill, the ring round it and the icon inside. */
export interface PastelTone {
  fill: string;
  ring: string;
  ink: string;
}

/**
 * The pastel bubble a stat tile's icon sits in, from any accent: a soft tint of it on the
 * surface, a translucent ring in the same hue, and the accent itself moved just far enough to
 * draw its icon at 3:1 on that tint (SC 1.4.11).
 */
export function pastelTone(accent: string, surface: string, mode: ColorMode): PastelTone {
  const fill = blend(accent, surface, BUBBLE[mode].fill);
  return {
    fill,
    ring: alpha(accent, BUBBLE[mode].ring),
    ink: ensureContrast(accent, fill, AA_LARGE),
  };
}
