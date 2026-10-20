import { describe, expect, it } from 'vitest';
import { TrackerOffDayError, offDayMessage } from '../../src/off-day';
import { trackerErrorText } from '../../src/tracker-error';
import { LOCATION_UNAVAILABLE_MESSAGE } from '../../src/location';
import { t } from './translator';

describe('offDayMessage', () => {
  it('is null on a working day', () => {
    expect(offDayMessage({ offReason: null, offLabel: null }, t)).toBeNull();
  });

  it('words the week off, ignoring any label', () => {
    expect(offDayMessage({ offReason: 'WEEKEND', offLabel: 'Sunday' }, t)).toBe(
      'Today is your week off — tracking is paused.',
    );
  });

  it('names the holiday when the portal sent its name', () => {
    expect(offDayMessage({ offReason: 'HOLIDAY', offLabel: 'Diwali' }, t)).toBe(
      'Today is a holiday (Diwali) — tracking is paused.',
    );
  });

  it('words an unnamed holiday without empty brackets', () => {
    expect(offDayMessage({ offReason: 'HOLIDAY', offLabel: null }, t)).toBe(
      'Today is a holiday — tracking is paused.',
    );
    expect(offDayMessage({ offReason: 'HOLIDAY', offLabel: '' }, t)).toBe(
      'Today is a holiday — tracking is paused.',
    );
  });

  it('names the leave code on approved leave', () => {
    expect(offDayMessage({ offReason: 'LEAVE', offLabel: 'CL' }, t)).toBe(
      'You’re on approved leave (CL) today — tracking is paused.',
    );
  });

  it('words leave with no code', () => {
    expect(offDayMessage({ offReason: 'LEAVE', offLabel: null }, t)).toBe(
      'You’re on approved leave today — tracking is paused.',
    );
  });
});

describe('TrackerOffDayError', () => {
  it('carries the workday it was refused on, with an English summary for logs', () => {
    const workday = { offReason: 'LEAVE' as const, offLabel: 'EL' };
    const error = new TrackerOffDayError(workday);

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('TrackerOffDayError');
    expect(error.message).toBe('Today is an off day — tracking is paused.');
    expect(error.workday).toBe(workday);
  });
});

describe('trackerErrorText', () => {
  const working = { offReason: null, offLabel: null };

  it('translates the location-off sentence by its English key', () => {
    const french = (source: string) =>
      source === LOCATION_UNAVAILABLE_MESSAGE ? 'Localisation désactivée.' : source;
    expect(trackerErrorText(LOCATION_UNAVAILABLE_MESSAGE, working, french)).toBe(
      'Localisation désactivée.',
    );
  });

  it('words a refusal on an off day from today’s workday', () => {
    expect(
      trackerErrorText(
        'Today is an off day — tracking is paused.',
        { offReason: 'HOLIDAY', offLabel: 'Holi' },
        t,
      ),
    ).toBe('Today is a holiday (Holi) — tracking is paused.');
  });

  it('passes the controller’s own sentence through on a working day', () => {
    expect(trackerErrorText('Could not mark your attendance.', working, t)).toBe(
      'Could not mark your attendance.',
    );
  });

  it('passes the sentence through before the workday is known', () => {
    expect(trackerErrorText('Network down.', null, t)).toBe('Network down.');
  });
});
