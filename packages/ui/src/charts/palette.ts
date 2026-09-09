/**
 * The chart palette.
 *
 * These are not hand-picked colours. The eight categorical slots are a validated set: a fixed
 * order (the order IS the colour-blindness safety mechanism, so it never changes), every slot
 * inside the mode's lightness band and above the chroma floor, and every adjacent pair far
 * enough apart under simulated protanopia and deuteranopia to stay tellable apart. They were
 * checked against THIS design system's own surfaces — #ffffff light, #151a26 dark (portal) and
 * #171B21 (the desktop tracker) — because contrast means nothing except against the surface a
 * chart actually renders on.
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
  '#2a78d6', // 1 blue
  '#eb6834', // 2 orange
  '#1baf7a', // 3 aqua
  '#eda100', // 4 yellow
  '#e87ba4', // 5 magenta
  '#008300', // 6 green
  '#4a3aa7', // 7 violet
  '#e34948', // 8 red
] as const;

/** The same eight hues, stepped for the dark surface. Not a different palette. */
export const CHART_SERIES_DARK = [
  '#3987e5',
  '#d95926',
  '#199e70',
  '#c98500',
  '#d55181',
  '#008300',
  '#9085e9',
  '#e66767',
] as const;

/**
 * One hue, light to dark, for magnitude (how much) rather than identity (which one).
 * Used when a chart's bars are all the same thing measured at different sizes.
 */
export const CHART_SEQUENTIAL_LIGHT = ['#cde2fb', '#9ec5f4', '#6da7ec', '#3987e5', '#256abf'];
export const CHART_SEQUENTIAL_DARK = ['#184f95', '#256abf', '#3987e5', '#6da7ec', '#9ec5f4'];

/**
 * Status colours, with reserved meaning. Never used as "series 5" — a status colour that
 * doubles as an identity colour makes "is this bad, or is it just Tuesday?" unanswerable.
 * Always shipped with a label, never as colour alone.
 */
export const CHART_STATUS = {
  good: '#0ca30c',
  warning: '#fab219',
  serious: '#ec835a',
  critical: '#d03b3b',
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

/** `#2a78d6` at 10% — the wash under an area line. Never a saturated block. */
export function wash(hex: string, alpha = 0.1): string {
  const value = Number.parseInt(hex.slice(1), 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
