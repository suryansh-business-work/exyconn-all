/**
 * Formatting helpers that carry NO timezone: a duration, a percentage and a count mean the
 * same thing in every zone. Everything that formats an instant or a date lives in `time.ts`,
 * the single module that applies the employee's chosen zone.
 */

const pad = (value: number) => String(value).padStart(2, '0');

/**
 * A duration as a running clock, "HH:mm:ss" (3661000 -> "01:01:01"); hours keep counting past
 * 99. What the live counters show: it ticks every second while tracking.
 */
export function formatClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${pad(hours)}:${pad(minutes)}:${pad(totalSeconds % 60)}`;
}

/** A clock that runs below zero, e.g. "-00:12:34" once a day's time left is used up. */
export function formatSignedClock(ms: number): string {
  return ms < 0 ? `-${formatClock(-ms)}` : formatClock(ms);
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

/** "Asha Rao" → "AR"; a blank name → "?" — the avatar in both apps' headers. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  const [first, ...rest] = parts;
  const last = rest.at(-1)?.[0] ?? '';
  return `${first[0]}${last}`.toUpperCase();
}
