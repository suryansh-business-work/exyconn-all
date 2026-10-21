import { isLocationUnavailable } from './location';
import { locationFailureText } from './location-failure';
import { offDayMessage } from './off-day';
import type { Translate } from './translate';
import type { Workday } from './types';

/**
 * Words for a refused tracker command, translated. Two refusals carry only English: no
 * location (worded from the platform's reason, see location-failure.ts) and an off day (worded from today's workday,
 * as the off-day banner words it). Anything else is the controller's own sentence, as it came.
 * The desktop gets `message` over IPC; the phone passes `messageOf(cause, fallback)`.
 */
export function trackerErrorText(
  message: string,
  workday: Pick<Workday, 'offReason' | 'offLabel'> | null,
  t: Translate,
): string {
  if (isLocationUnavailable(message)) {
    return locationFailureText(message, t);
  }
  return (workday === null ? null : offDayMessage(workday, t)) ?? message;
}
