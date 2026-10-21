import { describe, expect, it } from 'vitest';
import type { ReminderState } from '../../../src/types/meeting';
import {
  DEFAULT_REMINDER_INTERVAL_MINUTES,
  applyReminderAction,
  evaluateReminder,
  initialReminderState,
  remindersApply,
  resolveIntervalMinutes,
  type ReminderContext,
  type ReminderSettings,
} from '../../../src/utils/reminders';

const MINUTE = 60_000;
const settings: ReminderSettings = {
  enabled: true,
  intervalMinutes: 2,
  maxPerMeeting: 3,
  snoozeMinutes: 15,
};
const off: ReminderContext = { meetingState: 'IN_MEETING', transcriptionState: 'OFF' };

/** Runs the evaluator at each minute mark and returns when it showed a reminder. */
function shownAt(minutes: readonly number[], options = settings, context = off): number[] {
  let state: ReminderState = initialReminderState();
  const shown: number[] = [];
  for (const minute of minutes) {
    const tick = evaluateReminder(state, options, context, minute * MINUTE);
    state = tick.state;
    if (tick.show) {
      shown.push(minute);
    }
  }
  return shown;
}

describe('resolveIntervalMinutes', () => {
  it('uses the user pick over the company interval', () => {
    expect(resolveIntervalMinutes(5, '10')).toBe(10);
  });

  it('falls back to the company interval, then the default', () => {
    expect(resolveIntervalMinutes(5, 'org')).toBe(5);
    expect(resolveIntervalMinutes(0, 'org')).toBe(DEFAULT_REMINDER_INTERVAL_MINUTES);
  });
});

describe('remindersApply', () => {
  it('applies only in the call with transcription visibly off', () => {
    expect(remindersApply(settings, off)).toBe(true);
    expect(remindersApply(settings, { ...off, transcriptionState: 'UNKNOWN' })).toBe(false);
    expect(remindersApply(settings, { ...off, transcriptionState: 'ON' })).toBe(false);
    expect(remindersApply(settings, { ...off, meetingState: 'WAITING' })).toBe(false);
    expect(remindersApply({ ...settings, enabled: false }, off)).toBe(false);
  });
});

describe('evaluateReminder', () => {
  it('reminds at once, then every interval, up to the company cap', () => {
    expect(shownAt([0, 1, 2, 3, 4, 5, 6, 7, 8])).toEqual([0, 2, 4]);
  });

  it('follows a longer interval', () => {
    expect(shownAt([0, 2, 4, 5, 10], { ...settings, intervalMinutes: 5 })).toEqual([0, 5, 10]);
  });

  it('never reminds about an UNKNOWN state', () => {
    expect(shownAt([0, 2, 4], settings, { ...off, transcriptionState: 'UNKNOWN' })).toEqual([]);
  });

  it('stops and hides the banner when transcription comes on', () => {
    const first = evaluateReminder(initialReminderState(), settings, off, 0);
    expect(first.state.bannerVisible).toBe(true);
    const on = evaluateReminder(
      first.state,
      settings,
      { ...off, transcriptionState: 'ON' },
      MINUTE,
    );
    expect(on.show).toBe(false);
    expect(on.state).toMatchObject({ nextAt: null, bannerVisible: false, shown: 1 });
  });

  it('stops when the meeting ends', () => {
    const first = evaluateReminder(initialReminderState(), settings, off, 0);
    const ended = evaluateReminder(
      first.state,
      settings,
      { ...off, meetingState: 'ENDED' },
      5 * MINUTE,
    );
    expect(ended).toEqual({
      state: { ...first.state, nextAt: null, bannerVisible: false },
      show: false,
    });
  });

  it('waits for the next slot without showing again', () => {
    const first = evaluateReminder(initialReminderState(), settings, off, 0);
    const early = evaluateReminder(first.state, settings, off, MINUTE);
    expect(early).toEqual({ state: first.state, show: false });
  });
});

describe('applyReminderAction', () => {
  const shown = evaluateReminder(initialReminderState(), settings, off, 0).state;

  it('Remind later waits one interval', () => {
    const later = applyReminderAction(shown, 'LATER', settings, MINUTE);
    expect(later).toMatchObject({ nextAt: 3 * MINUTE, bannerVisible: false });
    expect(evaluateReminder(later, settings, off, 2 * MINUTE).show).toBe(false);
    expect(evaluateReminder(later, settings, off, 3 * MINUTE).show).toBe(true);
  });

  it('Snooze silences for the snooze length, then resumes', () => {
    const snoozed = applyReminderAction(shown, 'SNOOZE', settings, MINUTE);
    expect(snoozed).toMatchObject({ snoozedUntil: 16 * MINUTE, bannerVisible: false });
    const during = evaluateReminder(snoozed, settings, off, 10 * MINUTE);
    expect(during.show).toBe(false);
    expect(during.state.nextAt).toBe(16 * MINUTE);
    const after = evaluateReminder(during.state, settings, off, 16 * MINUTE);
    expect(after.show).toBe(true);
    expect(after.state.snoozedUntil).toBeNull();
  });

  it('Dismiss stops reminders for the rest of the meeting', () => {
    const dismissed = applyReminderAction(shown, 'DISMISS', settings, MINUTE);
    expect(dismissed).toMatchObject({ dismissed: true, nextAt: null, bannerVisible: false });
    expect(evaluateReminder(dismissed, settings, off, 60 * MINUTE).show).toBe(false);
  });
});
