/** Formatting helpers for tracker durations and activity ratios. */

/** Formats a millisecond duration as "Hh Mm" (e.g. 5_400_000 -> "1h 30m"). */
export function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

/** Active share of tracked time as a whole percentage (0 when nothing tracked). */
export function activityPercent(activeMs: number, idleMs: number): number {
  const total = activeMs + idleMs;
  if (total === 0) return 0;
  return Math.round((activeMs / total) * 100);
}
