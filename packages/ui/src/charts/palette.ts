import {
  amber,
  azure,
  blush,
  butter,
  coral,
  emerald,
  green,
  indigo,
  lavender,
  mint,
  orange,
  peach,
  periwinkle,
  pink,
  red,
  sky,
} from '../tokens/colors.tokens';
import type { ColorMode } from '../tokens/modes/color-mode';

/**
 * The chart palette.
 *
 * These are not hand-picked colours. The eight categorical slots are a validated set: a fixed
 * order (the order IS the colour-blindness safety mechanism, so it never changes), every slot
 * inside the mode's lightness band and above the chroma floor, and every adjacent pair far
 * enough apart under simulated protanopia and deuteranopia to stay tellable apart. They were
 * checked against THIS design system's own surfaces — `neutral[0]` light, `neutral[800]` dark
 * (portal and the desktop tracker) — because contrast means nothing except against the surface
 * a chart actually renders on.
 *
 * Assign slots in order and never cycle: a ninth generated hue is indistinguishable from an
 * existing one under colour-blindness. Past eight series, fold the tail into "Other".
 *
 * On the LIGHT surface, aqua, yellow and magenta sit below 3:1. That is allowed only because
 * every chart here ships a table view (see ChartCard) — the values are always readable without
 * relying on the fill.
 */

/** Categorical slots, light surface. Fixed order — see the note above before reordering. */
export const CHART_SERIES_LIGHT = [
  azure[500], // 1 blue
  orange[400], // 2 orange
  emerald[600], // 3 aqua
  amber[600], // 4 yellow
  pink[300], // 5 magenta
  green[800], // 6 green
  indigo[800], // 7 violet
  red[600], // 8 red
] as const;

/** The same eight hues, stepped for the dark surface. Not a different palette. */
export const CHART_SERIES_DARK = [
  azure[400],
  orange[700],
  emerald[700],
  amber[800],
  pink[500],
  green[800],
  indigo[300],
  red[400],
] as const;

/**
 * One hue, light to dark, for magnitude (how much) rather than identity (which one).
 * Used when a chart's bars are all the same thing measured at different sizes.
 */
export const CHART_SEQUENTIAL_LIGHT = [azure[100], azure[200], azure[300], azure[400], azure[600]];
export const CHART_SEQUENTIAL_DARK = [azure[800], azure[600], azure[400], azure[300], azure[200]];

/**
 * Status colours, with reserved meaning. Never used as "series 5" — a status colour that
 * doubles as an identity colour makes "is this bad, or is it just Tuesday?" unanswerable.
 * Always shipped with a label, never as colour alone.
 */
export const CHART_STATUS = {
  good: green[700],
  warning: amber[400],
  serious: orange[300],
  critical: red[700],
} as const;

/** A theme's own chart colours: eight categorical slots and a five-step magnitude ramp. */
export interface ChartSet {
  series: readonly string[];
  sequential: readonly string[];
}

/**
 * The portals' pastel set — sky, peach, lavender, mint, pink, butter, periwinkle, coral — drawn
 * with soft gradient fills. Adjacent slots alternate cool and warm, and light and deep, so
 * neighbours stay tellable apart; past eight series, fold the tail into "Other".
 *
 * Pastels sit below 3:1 on the light card by nature, as the validated set's aqua and yellow
 * already did. That is allowed only because every chart here ships a table view (ChartCard):
 * the values are always readable without relying on the fill. On the dark card every slot
 * clears 3:1.
 */
export const PASTEL_CHART: Record<ColorMode, ChartSet> = {
  light: {
    series: [
      sky[400],
      peach[400],
      lavender[400],
      mint[400],
      blush[400],
      butter[400],
      periwinkle[400],
      coral[400],
    ],
    sequential: [sky[200], sky[300], sky[400], sky[600], sky[800]],
  },
  dark: {
    series: [
      sky[300],
      peach[300],
      lavender[300],
      mint[300],
      blush[300],
      butter[300],
      periwinkle[300],
      coral[300],
    ],
    sequential: [sky[900], sky[700], sky[600], sky[300], sky[200]],
  },
};

export interface ChartPalette {
  /** Categorical slots for this mode, in their fixed order. */
  series: readonly string[];
  sequential: readonly string[];
  /**
   * The surface the chart sits on. Doubles as the colour of the 2px gap between touching
   * marks — that gap is what separates a stack, never a border drawn around each segment.
   */
  surface: string;
  /** Hairline grid, one step off the surface. Solid: a dashed grid reads as a threshold. */
  grid: string;
  /** Axis labels and legend text. Text NEVER wears a series colour. */
  ink: string;
  inkStrong: string;
  /**
   * Whether marks are filled with a soft gradient of their colour (the portals' pastel set)
   * rather than flat (the validated default the desktop tracker keeps).
   */
  gradient: boolean;
}

/**
 * Everything a chart needs to paint itself in one mode. A theme that brings its own `set` —
 * the portal theme's pastels — is drawn with it and with gradient fills; any other theme (the
 * desktop tracker's) keeps the validated flat palette above.
 */
export function chartPalette(
  mode: 'light' | 'dark',
  surface: string,
  grid: string,
  ink: string,
  inkStrong: string,
  set?: ChartSet,
): ChartPalette {
  const light = mode === 'light';
  return {
    series: set?.series ?? (light ? CHART_SERIES_LIGHT : CHART_SERIES_DARK),
    sequential: set?.sequential ?? (light ? CHART_SEQUENTIAL_LIGHT : CHART_SEQUENTIAL_DARK),
    surface,
    grid,
    ink,
    inkStrong,
    gradient: set !== undefined,
  };
}

/** A series colour at 10% — the wash under an area line. Never a saturated block. */
export function wash(hex: string, alpha = 0.1): string {
  const value = Number.parseInt(hex.slice(1), 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Just enough of Chart.js's scriptable context to lay a gradient across the plot area. */
interface FillContext {
  chart: {
    ctx: CanvasRenderingContext2D;
    chartArea?: { top: number; bottom: number; left: number; right: number };
  };
}

/**
 * A soft gradient fill for a mark: the colour at `from` opacity where the values are largest,
 * fading to `to` at the baseline — across the plot area, so every bar of a series shares one
 * gradient. Until Chart.js has laid the plot area out (its first pass), the flat wash stands in.
 */
export function fadeFill(color: string, from: number, to: number, horizontal = false) {
  return ({ chart }: FillContext): CanvasGradient | string => {
    const area = chart.chartArea;
    if (!area) {
      return wash(color, from);
    }
    const gradient = horizontal
      ? chart.ctx.createLinearGradient(area.right, 0, area.left, 0)
      : chart.ctx.createLinearGradient(0, area.top, 0, area.bottom);
    gradient.addColorStop(0, wash(color, from));
    gradient.addColorStop(1, wash(color, to));
    return gradient;
  };
}

/** How deep a soft bar's gradient runs: full colour at the data end, a little faded at the base. */
const BAR_FADE = { from: 1, to: 0.7 } as const;

/** A bar's fill: a soft gradient of its colour in the pastel set, the flat colour otherwise. */
export function barFill(palette: ChartPalette, color: string, horizontal: boolean) {
  return palette.gradient ? fadeFill(color, BAR_FADE.from, BAR_FADE.to, horizontal) : color;
}

/** How much deeper the pastel area gradient starts than the flat wash it replaces. */
const AREA_DEPTH = 3.5;

/**
 * The fill under an area line: a gradient fading from `strength` × 3.5 at the line to nothing
 * at the baseline in the pastel set — deeper at the line, where the eye reads it — and a flat
 * `strength` wash otherwise.
 */
export function areaFill(palette: ChartPalette, color: string, strength: number) {
  return palette.gradient ? fadeFill(color, strength * AREA_DEPTH, 0) : wash(color, strength);
}
