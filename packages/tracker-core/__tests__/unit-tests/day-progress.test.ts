import { describe, expect, it } from 'vitest';
import { dayFigures, dayProgressLabel, daySummary, dayTargetSource } from '../../src/day-progress';
import type { WorkProfile, Workday } from '../../src/types';
import { t } from './translator';

const HOUR = 3_600_000;

const PROFILE: WorkProfile = {
  workingTime: 'FIXED',
  workingTimeNote: '',
  workLocation: 'OFFICE',
  workLocationNote: '',
  workHoursPerDay: 6,
  targetMs: 6 * HOUR,
  workDays: [1, 2, 3, 4, 5],
};

const WORKDAY: Workday = {
  date: '2026-09-11',
  targetMs: 8 * HOUR,
  activeMs: 0,
  attendanceStatus: 'PRESENT',
  attendanceNote: null,
  attendanceMarked: true,
  offReason: null,
  offLabel: null,
  profileAddress: null,
};

describe('dayFigures', () => {
  it('falls back to HR’s contracted day when the portal sent no workday', () => {
    const figures = dayFigures(null, PROFILE, 3 * HOUR);
    expect(figures).toMatchObject({ targetMs: 6 * HOUR, percent: 50, hours: 6, done: false });
    expect(daySummary(figures, t)).toBe('50% — 03:00:00 left of your 6h day.');
  });

  it('prefers the portal’s workday, with the default hours when HR has no record', () => {
    const figures = dayFigures(WORKDAY, null, 2 * HOUR);
    expect(figures).toMatchObject({ targetMs: 8 * HOUR, percent: 25, hours: 8 });
    expect(dayProgressLabel(figures, 2 * HOUR, t)).toBe('02:00:00 of 08:00:00 worked today');
  });

  it('keeps the time left running below zero once the day is done', () => {
    const figures = dayFigures(WORKDAY, PROFILE, 8 * HOUR + 754_000);
    expect(figures).toMatchObject({ done: true, percent: 100, remainingMs: -754_000 });
    expect(daySummary(figures, t)).toBe('Full 6h day complete — -00:12:34 left.');
    expect(dayFigures(WORKDAY, PROFILE, 8 * HOUR)).toMatchObject({ done: true, remainingMs: 0 });
  });

  it('has nothing to fill without a target', () => {
    expect(dayFigures(null, null, HOUR)).toMatchObject({ percent: 0, done: false });
  });

  it('says where the target comes from', () => {
    expect(dayTargetSource(dayFigures(null, null, HOUR), t)).toContain('The default is 8');
  });
});
