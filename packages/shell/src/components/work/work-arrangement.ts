import type { MyWorkProfileQuery } from '@/graphql/generated';

/**
 * The contracted working day, in hours, when nobody has chosen one.
 *
 * Mirrors the server's own default (`constants/work.ts`). Accounts created before the field
 * existed read back as null, and every reader has to land on the same 8 — HR's directory,
 * this card, and the desktop tracker's progress bar are all showing one number.
 */
export const DEFAULT_WORK_HOURS = 8;

/** The working-arrangement slice of a user record, from any query that selects it. */
export type WorkArrangement = Pick<
  MyWorkProfileQuery['me'],
  | 'address'
  | 'brief'
  | 'workingTime'
  | 'workingTimeNote'
  | 'workLocation'
  | 'workLocationNote'
  | 'workHoursPerDay'
>;

/** Turns FLEXIBLE / HALF_DAY into "Flexible" / "Half day". */
export function humanize(value: string): string {
  const words = value.toLowerCase().replaceAll('_', ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** An arrangement's label, with its free-text note appended when there is one ("Other"). */
export function describeArrangement(
  value: string | null | undefined,
  note: string | null | undefined,
): string {
  const label = humanize(value ?? '—');
  return note ? `${label} — ${note}` : label;
}

/** The contracted day in hours, with the house default filled in. */
export function workHours(arrangement: Pick<WorkArrangement, 'workHoursPerDay'>): number {
  return arrangement.workHoursPerDay ?? DEFAULT_WORK_HOURS;
}
