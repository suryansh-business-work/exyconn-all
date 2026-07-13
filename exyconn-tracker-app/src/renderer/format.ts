/** Formatting helpers for the tracker dashboard. */

/** Format a duration in milliseconds as "Hh Mm Ss" (e.g. 3661000 -> "1h 1m 1s"). */
export function formatClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${minutes}m ${seconds}s`;
}

/** Format an ISO timestamp as a short relative string, or "Never" when absent. */
export function formatLastSync(iso: string | null): string {
  if (iso === null) {
    return 'Never';
  }
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) {
    return 'Never';
  }

  const diffSeconds = Math.floor((Date.now() - then) / 1000);
  if (diffSeconds < 60) {
    return 'Just now';
  }
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  return `${Math.floor(diffHours / 24)}d ago`;
}
