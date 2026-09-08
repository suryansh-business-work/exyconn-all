const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;

/**
 * A process uptime as the coarsest two units that are non-zero — "4d 6h", "12m 30s".
 * Deliberately not a date: this is a duration, so the viewer's date format does not
 * apply to it (timestamps on the same screen do go through `formatDateTime`).
 */
export function formatUptime(seconds: number): string {
  if (seconds < SECONDS_PER_MINUTE) {
    return `${Math.max(Math.round(seconds), 0)}s`;
  }
  const totalMinutes = Math.floor(seconds / SECONDS_PER_MINUTE);
  const totalHours = Math.floor(totalMinutes / MINUTES_PER_HOUR);
  const days = Math.floor(totalHours / HOURS_PER_DAY);
  if (days > 0) {
    return `${days}d ${totalHours % HOURS_PER_DAY}h`;
  }
  if (totalHours > 0) {
    return `${totalHours}h ${totalMinutes % MINUTES_PER_HOUR}m`;
  }
  return `${totalMinutes}m ${Math.round(seconds) % SECONDS_PER_MINUTE}s`;
}
