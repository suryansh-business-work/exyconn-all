import type { Translate } from './translate';
import type { Workday } from './types';

/**
 * The sentence an off day is refused with — the employee's week off, a public holiday, or
 * approved leave — or null on a working day. Both apps show this one sentence, translated.
 */
export function offDayMessage(
  workday: Pick<Workday, 'offReason' | 'offLabel'>,
  t: Translate,
): string | null {
  const label = workday.offLabel ?? '';
  switch (workday.offReason) {
    case 'WEEKEND':
      return t('Today is your week off — tracking is paused.');
    case 'HOLIDAY':
      return label === ''
        ? t('Today is a holiday — tracking is paused.')
        : t('Today is a holiday ({label}) — tracking is paused.', { label });
    case 'LEAVE':
      return label === ''
        ? t('You’re on approved leave today — tracking is paused.')
        : t('You’re on approved leave ({label}) today — tracking is paused.', { label });
    default:
      return null;
  }
}

/**
 * Tracking was refused because today is off. Carries the workday so the UI words it with
 * `offDayMessage(error.workday, t)`; the message is only the untranslated summary for logs.
 */
export class TrackerOffDayError extends Error {
  constructor(readonly workday: Pick<Workday, 'offReason' | 'offLabel'>) {
    super('Today is an off day — tracking is paused.');
    this.name = 'TrackerOffDayError';
  }
}
