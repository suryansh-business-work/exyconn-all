/**
 * How an employee is contracted to work: when, from where, and for how long a day.
 *
 * Lives in `constants/` rather than inside HR because three modules read it — HR writes it
 * onto the employee record, the tracker measures the day against it, and the employee portal
 * shows people their own terms. One list, so the three can never disagree.
 */

/** When the employee is expected to work. `OTHER` is free text on the record. */
export const WORKING_TIMES = ['FLEXIBLE', 'FIXED', 'OTHER'] as const;
export type WorkingTime = (typeof WORKING_TIMES)[number];

/** Where the employee is expected to work from. `OTHER` is free text on the record. */
export const WORK_LOCATIONS = ['OFFICE', 'HOME', 'HYBRID', 'OTHER'] as const;
export type WorkLocation = (typeof WORK_LOCATIONS)[number];

/**
 * The contracted day, in hours, when HR has not set one.
 *
 * Every working-time arrangement carries hours — a flexible day is still a day of a given
 * length, it is only the clock time that moves — so this is a default, never an absence.
 */
export const DEFAULT_WORK_HOURS_PER_DAY = 8;

/** Bounds HR may set a working day within. */
export const WORK_HOURS_MIN = 1;
export const WORK_HOURS_MAX = 24;

const MS_PER_HOUR = 3_600_000;

/** The contracted day as milliseconds, which is the unit every tracker total is in. */
export function workTargetMs(hours: number | null | undefined): number {
  return (hours ?? DEFAULT_WORK_HOURS_PER_DAY) * MS_PER_HOUR;
}
