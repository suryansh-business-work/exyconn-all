import { describe, it, expect } from 'vitest';
import { leaveDays } from '../../src/pages/employee/forms/apply-leave/apply-leave.days';

describe('leaveDays', () => {
  it('counts both ends, so a one-day leave is one day', () => {
    expect(leaveDays('2026-09-21T00:00:00', '2026-09-21T00:00:00')).toBe(1);
    expect(leaveDays('2026-09-21T00:00:00', '2026-09-25T00:00:00')).toBe(5);
  });

  it('spans a month end', () => {
    expect(leaveDays('2026-09-29T00:00:00', '2026-10-02T00:00:00')).toBe(4);
  });

  it('is 0 until both dates are set and in order', () => {
    expect(leaveDays('', '2026-09-21T00:00:00')).toBe(0);
    expect(leaveDays('2026-09-21T00:00:00', '')).toBe(0);
    expect(leaveDays('2026-09-22T00:00:00', '2026-09-21T00:00:00')).toBe(0);
  });
});
