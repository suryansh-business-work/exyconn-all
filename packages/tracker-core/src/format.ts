/**
 * Formatting helpers that carry NO timezone: a duration, a percentage and a count mean the
 * same thing in every zone. Everything that formats an instant or a date lives in `time.ts`,
 * the single module that applies the employee's chosen zone.
 */

/** Format a duration in milliseconds as "Hh Mm Ss" (e.g. 3661000 -> "1h 1m 1s"). */
export function formatClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${minutes}m ${seconds}s`;
}

/** Format a duration as "Hh Mm" — used in the report, where seconds are noise. */
export function formatHoursMinutes(ms: number): string {
  const totalMinutes = Math.max(0, Math.round(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) {
    return `${minutes}m`;
  }
  return `${hours}h ${minutes}m`;
}

/** Share of tracked time that was active, as a whole percentage. */
export function activityPercent(activeMs: number, idleMs: number): number {
  const total = activeMs + idleMs;
  if (total <= 0) {
    return 0;
  }
  return Math.round((activeMs / total) * 100);
}

/** Counts read better grouped ("12,304") than raw. */
export function formatCount(value: number): string {
  return value.toLocaleString();
}
