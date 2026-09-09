import { formatInTimeZone } from 'date-fns-tz';
import { FALLBACK_TIMEZONE, isValidTimezone } from '@exyconn/time';

/**
 * Which zone an employee's hours are read in, and WHY that one won.
 *
 * The rules themselves come from `@exyconn/time`, so this and the server cannot drift into
 * disagreeing about whether a zone is real — a disagreement that shows up as an admin reading
 * a day the hours were never aggregated in. What stays here is the part only this screen
 * needs: which candidate won, so the UI can say "workspace default" beside the zone.
 */

export { FALLBACK_TIMEZONE, isValidTimezone };

/** Which candidate won, so the UI can explain *why* an employee is on a given zone. */
export type TimezoneSource = 'chosen' | 'workspace' | 'device' | 'fallback';

/** Human-readable reason shown next to a resolved zone. */
export const TIMEZONE_SOURCE_LABEL: Record<TimezoneSource, string> = {
  chosen: 'chosen',
  workspace: 'workspace default',
  device: 'device',
  fallback: 'fallback',
};

export interface TimezoneResolution {
  timezone: string;
  source: TimezoneSource;
}

export interface TimezoneCandidates {
  /** The zone the employee picked for themselves in the desktop app. */
  employeeTimezone?: string | null;
  /** The admin-chosen default from tracker settings. */
  defaultTimezone?: string | null;
  /** The zone the employee's machine reported when it signed in. */
  deviceTimezone?: string | null;
}

/**
 * The EFFECTIVE zone for an employee, in the server's priority order:
 * their own pick -> the admin default -> their device's zone -> UTC.
 *
 * Each candidate has to be resolvable to win: the device's zone is client-supplied and never
 * validated on the way in, so a machine reporting nonsense must not poison what an admin reads.
 */
export function resolveTimezone(candidates: TimezoneCandidates): TimezoneResolution {
  const ordered = [
    { source: 'chosen' as const, value: candidates.employeeTimezone },
    { source: 'workspace' as const, value: candidates.defaultTimezone },
    { source: 'device' as const, value: candidates.deviceTimezone },
  ];
  for (const candidate of ordered) {
    if (isValidTimezone(candidate.value)) {
      return { timezone: candidate.value, source: candidate.source };
    }
  }
  return { timezone: FALLBACK_TIMEZONE, source: 'fallback' };
}

/** The zone's current UTC offset, e.g. "UTC+05:30". Reflects DST at `at`. */
export function timezoneOffsetLabel(timezone: string, at: Date = new Date()): string {
  return `UTC${formatInTimeZone(at, timezone, 'xxx')}`;
}

/** "Asia/Kolkata (UTC+05:30)" — the picker label for one zone. */
export function timezoneOptionLabel(timezone: string, at?: Date): string {
  return `${timezone} (${timezoneOffsetLabel(timezone, at)})`;
}

/** "UTC+05:30 · workspace default" — the offset and the reason this zone won. */
export function timezoneMeta({ timezone, source }: TimezoneResolution): string {
  return `${timezoneOffsetLabel(timezone)} · ${TIMEZONE_SOURCE_LABEL[source]}`;
}

/** "Asia/Kolkata (UTC+05:30 · workspace default)" — the one-line form for a fact sheet. */
export function timezoneSummary(resolution: TimezoneResolution): string {
  return `${resolution.timezone} (${timezoneMeta(resolution)})`;
}
