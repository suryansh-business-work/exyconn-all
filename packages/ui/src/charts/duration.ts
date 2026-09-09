/**
 * Turning tracked milliseconds into the hours a chart is actually plotted in.
 *
 * Lives here rather than beside either caller because the portal and the desktop tracker plot
 * the SAME facts: a chart in My Tracker and a chart in the employee's own app showing
 * different numbers for the same Tuesday is worse than either chart alone. One conversion,
 * one rounding rule, both ends.
 */

/** Milliseconds as hours, to one decimal — the unit every tracked-time chart is plotted in. */
export function msToHours(ms: number): number {
  return Math.round((ms / 3_600_000) * 10) / 10;
}

/**
 * "6.5h", or "45m" below the hour.
 *
 * Under an hour a decimal is a number nobody converts in their head — "0.4h" means nothing at
 * a glance, "24m" means something immediately.
 */
export function formatHours(hours: number): string {
  if (hours === 0) {
    return '0h';
  }
  if (hours < 1) {
    return `${Math.round(hours * 60)}m`;
  }
  return `${Math.round(hours * 10) / 10}h`;
}
