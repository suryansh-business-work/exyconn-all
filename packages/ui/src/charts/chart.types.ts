/** One named row of numbers. `id` is stable, so a colour follows the entity, not its rank. */
export interface ChartSeries {
  /**
   * Stable identity. A series keeps its colour when a filter removes its neighbours — a
   * reader who learned "idle is orange" must not find orange means something else tomorrow.
   */
  id: string;
  label: string;
  values: readonly number[];
  /**
   * Overrides the slot this series would otherwise take. For series that MEAN something
   * (worked/idle) rather than merely being series 1 and 2.
   */
  color?: string;
}

/** What every chart in this folder is drawn from. */
export interface ChartData {
  /** One label per position in every series' `values`. */
  labels: readonly string[];
  series: readonly ChartSeries[];
}

/** Turns a raw value into what the reader sees in a tooltip, a table cell or an axis tick. */
export type ValueFormatter = (value: number) => string;
