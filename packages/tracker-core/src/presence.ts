import type { PresenceStatus } from './types';

/** How one presence is offered to the employee, and what it means for tracking. */
export interface PresenceOption {
  status: PresenceStatus;
  label: string;
  /** What choosing it does, said before they choose it rather than after. */
  caption: string;
}

/**
 * What an employee can say they are doing, in the order the picker offers it.
 *
 * Every entry but WORKING means they have stepped away from the work, and the app pauses
 * tracking on those — saying you are at lunch while the tracker keeps counting the minutes
 * as work is the one outcome nobody wants, least of all the person whose timesheet it is.
 */
export const PRESENCE_OPTIONS: readonly PresenceOption[] = [
  { status: 'WORKING', label: 'Working', caption: 'Tracking runs as normal' },
  { status: 'LUNCH', label: 'On lunch', caption: 'Pauses tracking until you are back' },
  { status: 'BREAK', label: 'On a break', caption: 'Pauses tracking until you are back' },
  {
    status: 'MEETING',
    label: 'In a meeting',
    caption: 'Pauses tracking — claim the time if it was work',
  },
  { status: 'AWAY', label: 'Away', caption: 'Pauses tracking until you are back' },
];

/** The label for one status, for anywhere that shows a presence without offering the list. */
export function presenceLabel(status: PresenceStatus): string {
  return PRESENCE_OPTIONS.find((option) => option.status === status)?.label ?? 'Working';
}

/**
 * Whether this presence means the employee has stepped away.
 *
 * The single definition both ends read: the app pauses on these, and the portal splits its
 * reporting on the same list — two lists would eventually disagree about lunch.
 */
export function isAwayPresence(status: PresenceStatus): boolean {
  return status !== 'WORKING';
}
