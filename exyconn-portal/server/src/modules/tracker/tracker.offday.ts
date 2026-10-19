import { forbidden } from '../../utils/errors';
import { trackerExpectedService, type TrackerOffDay } from './tracker.expected.service';

/** The sentence an off day is refused with, or null on a working day. */
export function offDayMessage({ offReason, offLabel }: TrackerOffDay): string | null {
  const label = offLabel ? ` (${offLabel})` : '';
  switch (offReason) {
    case 'WEEKEND':
      return 'Today is your week off — tracking is paused.';
    case 'HOLIDAY':
      return `Today is a holiday${label} — tracking is paused.`;
    case 'LEAVE':
      return `You're on approved leave${label} today — tracking is paused.`;
    default:
      return null;
  }
}

/**
 * Refuses tracking on the employee's week off, a public holiday they observe, or a day of
 * approved leave — decided by the same rules as their expected hours, so the app refuses
 * exactly the days its calendar shows as off.
 */
export async function assertWorkingDay(userId: string, timezone: string): Promise<void> {
  const message = offDayMessage(await trackerExpectedService.offDayToday(userId, timezone));
  if (message !== null) {
    forbidden(message);
  }
}
