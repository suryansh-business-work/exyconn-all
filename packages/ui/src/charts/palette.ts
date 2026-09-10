import { amber, azure, emerald, green, indigo, orange, pink, red } from '../tokens/colors.tokens';

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
}

/** Everything a chart needs to paint itself in one mode. */
export function chartPalette(
  mode: 'light' | 'dark',
  surface: string,
  grid: string,
  ink: string,
  inkStrong: string,
): ChartPalette {
  const light = mode === 'light';
  return {
    series: light ? CHART_SERIES_LIGHT : CHART_SERIES_DARK,
    sequential: light ? CHART_SEQUENTIAL_LIGHT : CHART_SEQUENTIAL_DARK,
    surface,
    grid,
    ink,
    inkStrong,
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
