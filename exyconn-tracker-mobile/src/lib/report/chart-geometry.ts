import type { ChartData } from './charts';

/**
 * Turning chart series into the shapes an SVG draws. Pure — sizes in, rectangles and points
 * out — so the geometry is tested here and the chart components only paint it.
 */

/** Where the plot sits inside the chart box: room on the left for ticks, below for labels. */
export interface PlotArea {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface BarSegment {
  seriesId: string;
  y: number;
  height: number;
}

export interface BarColumn {
  /** The column's day label — unique within a month, so it doubles as the React key. */
  key: string;
  label: string;
  x: number;
  width: number;
  segments: BarSegment[];
}

export interface Point {
  x: number;
  y: number;
}

/** The surface showing through where one stacked segment meets the next. */
export const STACK_GAP = 2;
/** Room left of the plot for the value ticks, and below it for the day labels. */
const AXIS_WIDTH = 40;
const LABEL_HEIGHT = 20;
const TOP_PAD = 8;
const RIGHT_PAD = 4;
/** Never fill a slot: the leftover band is air, not a wider bar. */
const MAX_BAR_WIDTH = 24;
const BAR_SHARE = 0.7;

/** The plot inside a `width` × `height` chart, after the axis gutters. Never negative. */
export function plotArea(width: number, height: number): PlotArea {
  return {
    left: AXIS_WIDTH,
    top: TOP_PAD,
    width: Math.max(0, width - AXIS_WIDTH - RIGHT_PAD),
    height: Math.max(0, height - TOP_PAD - LABEL_HEIGHT),
  };
}

/** A round axis ceiling at or above `value` — 1, 2, 2.5 or 5 of its power of ten. */
export function niceCeiling(value: number): number {
  if (!(value > 0)) {
    return 1;
  }
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((candidate) => value <= candidate * magnitude) ?? 10;
  return step * magnitude;
}

/** The tallest stack across every label — what the bar axis has to reach. */
export function stackedMax(data: ChartData): number {
  return data.labels.reduce((max, _label, index) => {
    const total = data.series.reduce((sum, series) => sum + (series.values[index] ?? 0), 0);
    return Math.max(max, total);
  }, 0);
}

/** Axis ticks from 0 to `max` in `count` equal steps, bottom first. */
export function ticks(max: number, count: number): number[] {
  return Array.from({ length: count + 1 }, (_unused, step) => (max * step) / count);
}

/** Every `n`th label is drawn, so 31 day numbers never overprint on a phone. */
export function labelStep(count: number, maxLabels: number): number {
  return Math.max(1, Math.ceil(count / Math.max(1, maxLabels)));
}

function valueHeight(value: number, max: number, plotHeight: number): number {
  return max > 0 ? (Math.max(0, value) / max) * plotHeight : 0;
}

/** The segments of one column, stacked bottom-up in series order, a gap between each. */
function stackColumn(data: ChartData, index: number, max: number, plot: PlotArea): BarSegment[] {
  const segments: BarSegment[] = [];
  let top = plot.top + plot.height;
  for (const series of data.series) {
    const full = valueHeight(series.values[index] ?? 0, max, plot.height);
    if (full > 0) {
      const gap = segments.length > 0 ? Math.min(STACK_GAP, full) : 0;
      const height = full - gap;
      top -= full;
      segments.push({ seriesId: series.id, y: top, height });
    }
  }
  return segments;
}

/** One column per label; each series' value stacked on the one before it. */
export function stackedColumns(data: ChartData, max: number, plot: PlotArea): BarColumn[] {
  const slot = data.labels.length > 0 ? plot.width / data.labels.length : 0;
  const width = Math.min(MAX_BAR_WIDTH, slot * BAR_SHARE);
  return data.labels.map((label, index) => ({
    key: label,
    label,
    x: plot.left + slot * index + (slot - width) / 2,
    width,
    segments: stackColumn(data, index, max, plot),
  }));
}

/** The centre of each label's slot — where a column stands, a point sits and a label is drawn. */
export function slotCenters(count: number, plot: PlotArea): number[] {
  const slot = count > 0 ? plot.width / count : 0;
  return Array.from({ length: count }, (_unused, index) => plot.left + slot * index + slot / 2);
}

/** One point per value, centred in its label's slot — the same slots the columns use. */
export function linePoints(values: readonly number[], max: number, plot: PlotArea): Point[] {
  const centers = slotCenters(values.length, plot);
  return values.map((value, index) => ({
    x: centers[index],
    y: plot.top + plot.height - valueHeight(value, max, plot.height),
  }));
}

/** The SVG path through the points. */
export function linePath(points: readonly Point[]): string {
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x} ${point.y}`).join(' ');
}

/** The line closed down to the baseline — the soft area under an activity trend. */
export function areaPath(points: readonly Point[], baseline: number): string {
  if (points.length === 0) {
    return '';
  }
  const first = points[0];
  const last = points.at(-1) ?? first;
  return `${linePath(points)} L${last.x} ${baseline} L${first.x} ${baseline} Z`;
}
