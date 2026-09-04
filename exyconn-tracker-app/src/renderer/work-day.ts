import type { AttendanceStatus, WorkProfile } from '@shared/types';

/**
 * The contracted working day, in hours, when HR has not set one.
 *
 * Mirrors the portal's own default (`constants/work.ts`) — the app states this number to the
 * employee as a hint, so it has to be the number the portal would actually measure against.
 */
export const DEFAULT_WORK_HOURS = 8;

/** How an employee can mark themselves in, and what each option means on the day. */
export const ATTENDANCE_OPTIONS: ReadonlyArray<{ value: AttendanceStatus; label: string }> = [
  { value: 'PRESENT', label: 'Present' },
  { value: 'WFH', label: 'Working from home' },
  { value: 'HALF_DAY', label: 'Half day' },
];

/** Turns FLEXIBLE / HALF_DAY into "Flexible" / "Half day". */
export function humanize(value: string): string {
  const words = value.toLowerCase().replaceAll('_', ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * One line describing what HR contracted, for the settings screen.
 *
 * The free-text note is appended when there is one, which is exactly the "Other" case — an
 * arrangement whose name means nothing without it.
 */
export function describeArrangement(profile: WorkProfile): string {
  const time = profile.workingTimeNote
    ? `${humanize(profile.workingTime)} (${profile.workingTimeNote})`
    : humanize(profile.workingTime);
  const place = profile.workLocationNote
    ? `${humanize(profile.workLocation)} (${profile.workLocationNote})`
    : humanize(profile.workLocation);
  return `${time} · ${place} · ${profile.workHoursPerDay}h a day`;
}
