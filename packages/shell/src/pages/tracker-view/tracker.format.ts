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

/**
 * How long after its last check-in a device still counts as running the tracker. The desktop
 * app heartbeats once a minute, so this tolerates one missed beat before the console stops
 * claiming somebody is online — a laptop that closed its lid should not read as "online" for
 * an hour, and a single dropped request should not read as "offline".
 */
const ONLINE_WINDOW_MS = 150_000;

/** Whether a device checked in recently enough to be running the tracker right now. */
export function isDeviceOnline(lastSeenAt: string, now: Date = new Date()): boolean {
  const seen = new Date(lastSeenAt).getTime();
  if (Number.isNaN(seen)) {
    return false;
  }
  return now.getTime() - seen <= ONLINE_WINDOW_MS;
}
