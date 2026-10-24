import { describe, expect, it } from 'vitest';
import {
  activityPercent,
  formatClock,
  formatCount,
  formatHoursMinutes,
  formatSignedClock,
} from '../../src/format';

describe('formatClock', () => {
  it('splits a duration into hours, minutes and seconds', () => {
    expect(formatClock(3_661_000)).toBe('01:01:01');
    expect(formatClock(59_999)).toBe('00:00:59');
    expect(formatClock(360_000_000)).toBe('100:00:00');
  });

  it('never shows a negative clock', () => {
    expect(formatClock(-5000)).toBe('00:00:00');
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

describe('formatSignedClock', () => {
  it('keeps running below zero once the time left is used up', () => {
    expect(formatSignedClock(754_000)).toBe('00:12:34');
    expect(formatSignedClock(-754_000)).toBe('-00:12:34');
    expect(formatSignedClock(0)).toBe('00:00:00');
  });
});
