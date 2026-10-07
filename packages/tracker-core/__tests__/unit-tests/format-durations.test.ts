import { describe, expect, it } from 'vitest';
import { activityPercent, formatClock, formatCount, formatHoursMinutes } from '../../src/format';

describe('formatClock', () => {
  it('splits a duration into hours, minutes and seconds', () => {
    expect(formatClock(3_661_000)).toBe('1h 1m 1s');
    expect(formatClock(59_999)).toBe('0h 0m 59s');
  });

  it('never shows a negative clock', () => {
    expect(formatClock(-5000)).toBe('0h 0m 0s');
  });
});

describe('formatHoursMinutes', () => {
  it('drops the hours while there are none', () => {
    expect(formatHoursMinutes(45 * 60_000)).toBe('45m');
    expect(formatHoursMinutes(-1)).toBe('0m');
  });

  it('rounds to the nearest minute and carries into hours', () => {
    expect(formatHoursMinutes(2 * 3_600_000 + 5 * 60_000 + 30_000)).toBe('2h 6m');
    expect(formatHoursMinutes(59 * 60_000 + 40_000)).toBe('1h 0m');
  });
});

describe('activityPercent', () => {
  it('is the active share of tracked time, rounded', () => {
    expect(activityPercent(2, 1)).toBe(67);
    expect(activityPercent(10, 0)).toBe(100);
  });

  it('is zero when nothing was tracked', () => {
    expect(activityPercent(0, 0)).toBe(0);
    expect(activityPercent(-5, 2)).toBe(0);
  });
});

describe('formatCount', () => {
  it('groups digits the way the runtime locale does', () => {
    expect(formatCount(12_304)).toBe((12_304).toLocaleString());
    expect(formatCount(7)).toBe('7');
  });
});
