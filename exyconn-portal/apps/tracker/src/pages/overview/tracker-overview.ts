import type { BreakdownBucket } from '@exyconn/shell/components/dashboard/StatBreakdown';

/**
 * Tallies the rows by one of their string fields, as breakdown buckets.
 *
 * The tracker's own queries return lists rather than a server-side `TableStats`, so the
 * one distribution this overview shows — devices per platform — is counted here.
 */
export function countBy<T>(rows: readonly T[], key: (row: T) => string): BreakdownBucket[] {
  const tally = new Map<string, number>();
  for (const row of rows) {
    const value = key(row);
    tally.set(value, (tally.get(value) ?? 0) + 1);
  }
  return [...tally].map(([value, count]) => ({ value, count }));
}
