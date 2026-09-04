import { describe, expect, it } from 'vitest';
import { decideAutoAction, hourIn, isWithinWindow, type AutoStartInput } from './auto-start';

/** A workspace on a 9-to-18 schedule, mid-morning, with everything else in order. */
const base: AutoStartInput = {
  enabled: true,
  startHour: 9,
  stopHour: 18,
  hour: 10,
  status: 'idle',
  attendanceMarked: true,
  overridden: false,
};

describe('isWithinWindow', () => {
  it('covers the hours between start and stop, and excludes the stop hour itself', () => {
    expect(isWithinWindow(9, 18, 9)).toBe(true);
    expect(isWithinWindow(9, 18, 17)).toBe(true);
    expect(isWithinWindow(9, 18, 18)).toBe(false);
    expect(isWithinWindow(9, 18, 8)).toBe(false);
  });

  it('runs past midnight when the stop hour is at or before the start', () => {
    expect(isWithinWindow(22, 6, 23)).toBe(true);
    expect(isWithinWindow(22, 6, 2)).toBe(true);
    expect(isWithinWindow(22, 6, 12)).toBe(false);
    expect(isWithinWindow(22, 6, 6)).toBe(false);
  });
});

describe('decideAutoAction', () => {
  it('starts an idle tracker inside the window', () => {
    expect(decideAutoAction(base)).toBe('start');
  });

  it('does nothing at all while the schedule is switched off', () => {
    expect(decideAutoAction({ ...base, enabled: false })).toBe('none');
    expect(decideAutoAction({ ...base, enabled: false, hour: 22, status: 'tracking' })).toBe(
      'none',
    );
  });

  it('will not start before the employee has marked their attendance', () => {
    expect(decideAutoAction({ ...base, attendanceMarked: false })).toBe('none');
  });

  it('will not click through the consent screen', () => {
    expect(decideAutoAction({ ...base, status: 'consent-required' })).toBe('none');
  });

  it("leaves a paused tracker alone — pausing was the employee's own decision", () => {
    expect(decideAutoAction({ ...base, status: 'paused' })).toBe('none');
  });

  it('does not restart tracking the employee stopped early', () => {
    expect(decideAutoAction({ ...base, overridden: true })).toBe('none');
  });

  it('stops tracking once the window has ended', () => {
    expect(decideAutoAction({ ...base, hour: 19, status: 'tracking' })).toBe('stop');
  });

  it('has nothing to stop outside the window when nothing is running', () => {
    expect(decideAutoAction({ ...base, hour: 19, status: 'idle' })).toBe('none');
  });

  it('does not start outside the window', () => {
    expect(decideAutoAction({ ...base, hour: 7 })).toBe('none');
  });

  it('starts a night shift after midnight', () => {
    expect(decideAutoAction({ ...base, startHour: 22, stopHour: 6, hour: 1 })).toBe('start');
  });
});

describe('hourIn', () => {
  it('reads the hour on the employee timezone, not this machine', () => {
    const noonUtc = new Date('2026-09-04T12:00:00.000Z');
    expect(hourIn('UTC', noonUtc)).toBe(12);
    // Kolkata is UTC+5:30, so midday UTC is half past five in the evening there.
    expect(hourIn('Asia/Kolkata', noonUtc)).toBe(17);
  });

  it('reads midnight as 0 rather than 24', () => {
    expect(hourIn('UTC', new Date('2026-09-04T00:30:00.000Z'))).toBe(0);
  });
});
