/**
 * Helpers for reading a `listXxxStats` (TableStats) result on a dashboard, so the stat cards
 * come from one server aggregation instead of fetching every row. Structurally typed so it
 * works with any module's generated stats query result.
 */
export interface TableStatsShape {
  total: number;
  counts: Array<{ field: string; buckets: Array<{ value: string; count: number }> }>;
  sums: Array<{ field: string; total: number }>;
}

type Stats = TableStatsShape | null | undefined;

/** Total row count for the module. */
export function statTotal(stats: Stats): number {
  return stats?.total ?? 0;
}

/** Count of rows whose `field` equals `value` (e.g. status = 'PAID'). */
export function statCount(stats: Stats, field: string, value: string): number {
  const counts = stats?.counts.find((entry) => entry.field === field);
  return counts?.buckets.find((bucket) => bucket.value === value)?.count ?? 0;
}

/** Number of distinct values seen for `field` (e.g. how many roles are in use). */
export function statDistinct(stats: Stats, field: string): number {
  return stats?.counts.find((entry) => entry.field === field)?.buckets.length ?? 0;
}

/** Sum of a numeric `field` (e.g. total revenue from `amount`). */
export function statSum(stats: Stats, field: string): number {
  return stats?.sums.find((entry) => entry.field === field)?.total ?? 0;
}
