import { describe, expect, it } from 'vitest';
import type { WorkProfile, Workday } from '@exyconn/tracker-core';
import { dayFigures, daySummary } from '../../../../src/lib/dashboard/day-progress';

const HOUR = 3_600_000;

const PROFILE: WorkProfile = {
  workingTime: 'FIXED',
  workingTimeNote: '',
  workLocation: 'OFFICE',
  workLocationNote: '',
  workHoursPerDay: 6,
  targetMs: 6 * HOUR,
};

const WORKDAY: Workday = {
  date: '2026-09-11',
  targetMs: 4 * HOUR,
  activeMs: 0,
  attendanceStatus: 'PRESENT',
  attendanceNote: null,
  attendanceMarked: true,
};

describe('dayFigures', () => {
  it('falls back to HR’s contracted day when the portal sent no workday', () => {
    const figures = dayFigures(null, PROFILE, 3 * HOUR);
    expect(figures).toMatchObject({ targetMs: 6 * HOUR, percent: 50, hours: 6, done: false });
    expect(daySummary(figures)).toBe('50% — 3h 0m left of your 6h day.');
  });

  it('prefers the portal’s workday and the default hours when HR has no record', () => {
    const figures = dayFigures(WORKDAY, null, 4 * HOUR);
    expect(figures).toMatchObject({ targetMs: 4 * HOUR, remainingMs: 0, done: true, hours: 8 });
  });
});
