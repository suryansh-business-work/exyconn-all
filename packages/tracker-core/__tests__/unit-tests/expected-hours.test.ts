import { describe, expect, it } from 'vitest';
import {
  dayMarksOf,
  formatSignedHoursMinutes,
  monthTarget,
  todayKeyIn,
  workedMsOf,
  type ExpectedRange,
} from '../../src/expected-hours';
import { targetFigures } from '../../src/target-figures';

const HOUR = 3_600_000;
const DAY = 8 * HOUR;

/** Mon 2 – Sun 8 Feb 2026: a leave day, a holiday, two week-off days and three working days. */
const CONTRACT: ExpectedRange = {
  workHoursPerDay: 8,
  days: [
    { date: '2026-02-02', expectedMs: DAY, offReason: null, offLabel: null },
    { date: '2026-02-03', expectedMs: 0, offReason: 'LEAVE', offLabel: 'CL' },
    { date: '2026-02-04', expectedMs: DAY },
    { date: '2026-02-05', expectedMs: 0, offReason: 'HOLIDAY', offLabel: 'Founders Day' },
    { date: '2026-02-06', expectedMs: DAY, offReason: null, offLabel: null },
    { date: '2026-02-07', expectedMs: 0, offReason: 'WEEKEND', offLabel: null },
    { date: '2026-02-08', expectedMs: 0, offReason: 'WEEKEND', offLabel: '' },
  ],
};

describe('todayKeyIn', () => {
  it('reads the date in the employee’s zone, not UTC', () => {
    const lateEvening = new Date('2026-02-03T20:00:00.000Z');
    expect(todayKeyIn('UTC', lateEvening)).toBe('2026-02-03');
    expect(todayKeyIn('Asia/Kolkata', lateEvening)).toBe('2026-02-04');
    expect(todayKeyIn('America/Los_Angeles', new Date('2026-02-03T05:00:00.000Z'))).toBe(
      '2026-02-02',
    );
  });

  it('defaults to now', () => {
    expect(todayKeyIn('UTC')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('workedMsOf', () => {
  it('adds approved off-computer time to measured time', () => {
    expect(workedMsOf({ date: 'd', activeMs: 2 * HOUR, manualMs: HOUR })).toBe(3 * HOUR);
  });

  it('counts a day with no bucket, or no claim, as what it has', () => {
    expect(workedMsOf(undefined)).toBe(0);
    expect(workedMsOf({ date: 'd', activeMs: HOUR, manualMs: null })).toBe(HOUR);
    expect(workedMsOf({ date: 'd', activeMs: HOUR })).toBe(HOUR);
  });
});

describe('formatSignedHoursMinutes', () => {
  it('signs a deficit and a surplus', () => {
    expect(formatSignedHoursMinutes(-(3 * HOUR + 20 * 60_000))).toBe('-3h 20m');
    expect(formatSignedHoursMinutes(HOUR + 5 * 60_000)).toBe('+1h 5m');
  });

  it('shows no sign when it rounds to even', () => {
    expect(formatSignedHoursMinutes(0)).toBe('0m');
    expect(formatSignedHoursMinutes(-29_000)).toBe('0m');
    expect(formatSignedHoursMinutes(29_000)).toBe('0m');
  });

  it('signs anything that rounds to a minute', () => {
    expect(formatSignedHoursMinutes(-31_000)).toBe('-1m');
  });
});

describe('monthTarget', () => {
  const worked = [
    { date: '2026-02-02', activeMs: 7 * HOUR, manualMs: HOUR },
    { date: '2026-02-04', activeMs: 5 * HOUR },
    { date: '2026-02-06', activeMs: 2 * HOUR },
  ];

  it('counts only finished days towards the deficit, and today is not finished', () => {
    const target = monthTarget(CONTRACT, worked, '2026-02-06');

    expect(target.expectedMs).toBe(3 * DAY);
    expect(target.expectedSoFarMs).toBe(2 * DAY);
    expect(target.workedMs).toBe(15 * HOUR);
    expect(target.deficitMs).toBe(15 * HOUR - 2 * DAY);
  });

  it('marks a finished working day short only when it fell below its contract', () => {
    const target = monthTarget(CONTRACT, worked, '2026-02-06');

    // The 2nd made its 8h with the claim; the 4th did not; the 6th is today.
    expect([...target.shortDates]).toEqual(['2026-02-04']);
  });

  it('sorts off days into leave, holiday and week off, with their labels', () => {
    const target = monthTarget(CONTRACT, worked, '2026-02-09');

    expect([...target.leaveDates]).toEqual(['2026-02-03']);
    expect([...target.holidayDates]).toEqual(['2026-02-05']);
    expect([...target.weekOffDates]).toEqual(['2026-02-07', '2026-02-08']);
    // A blank label is no label.
    expect(Object.fromEntries(target.offLabels)).toEqual({
      '2026-02-03': 'CL',
      '2026-02-05': 'Founders Day',
    });
  });

  it('prices leave at the contracted working day', () => {
    expect(monthTarget(CONTRACT, [], '2026-02-01').leaveMs).toBe(DAY);
  });

  it('is all zeros for an empty range', () => {
    const target = monthTarget({ workHoursPerDay: 8, days: [] }, [], '2026-02-01');

    expect(target).toMatchObject({ expectedMs: 0, expectedSoFarMs: 0, workedMs: 0, deficitMs: 0 });
    expect(target.shortDates.size).toBe(0);
  });
});

describe('dayMarksOf', () => {
  it('gives each marked day one mark', () => {
    const marks = dayMarksOf(monthTarget(CONTRACT, [], '2026-02-09'));

    expect(Object.fromEntries(marks)).toEqual({
      '2026-02-02': 'SHORT',
      '2026-02-03': 'LEAVE',
      '2026-02-04': 'SHORT',
      '2026-02-05': 'HOLIDAY',
      '2026-02-06': 'SHORT',
      '2026-02-07': 'WEEK_OFF',
      '2026-02-08': 'WEEK_OFF',
    });
  });

  it('lets leave win over a short day on the same date', () => {
    // A day that was due and then turned into leave keeps its contracted hours.
    const marks = dayMarksOf(
      monthTarget(
        {
          workHoursPerDay: 8,
          days: [{ date: '2026-02-02', expectedMs: DAY, offReason: 'LEAVE', offLabel: 'EL' }],
        },
        [],
        '2026-02-03',
      ),
    );

    expect(marks.get('2026-02-02')).toBe('LEAVE');
  });
});

describe('targetFigures', () => {
  it('lists expected, logged, the signed deficit in red, and the worded leave', () => {
    const target = monthTarget(
      CONTRACT,
      [{ date: '2026-02-02', activeMs: 5 * HOUR }],
      '2026-02-03',
    );

    expect(targetFigures(target, '1 day (-8h 0m)')).toEqual([
      { id: 'expected', label: 'Expected this month', value: '24h 0m', alert: false },
      { id: 'logged', label: 'Logged this month', value: '5h 0m', alert: false },
      { id: 'deficit', label: 'Deficit so far', value: '-3h 0m', alert: true },
      { id: 'leave', label: 'Leave this month', value: '1 day (-8h 0m)', alert: false },
    ]);
  });

  it('does not alert when the employee is level or ahead', () => {
    const ahead = monthTarget(CONTRACT, [{ date: '2026-02-02', activeMs: 9 * HOUR }], '2026-02-03');

    expect(targetFigures(ahead, '0 days')[2]).toEqual({
      id: 'deficit',
      label: 'Deficit so far',
      value: '+1h 0m',
      alert: false,
    });
  });
});
