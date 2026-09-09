import { describe, expect, it } from 'vitest';
import { formatHours, msToHours } from '../../src/charts/duration';

const HOUR = 3_600_000;

describe('msToHours', () => {
  it('converts to hours at one decimal', () => {
    expect(msToHours(HOUR * 7.5)).toBe(7.5);
    expect(msToHours(0)).toBe(0);
  });

  it('rounds rather than truncating, so a full day does not read as 7.9h', () => {
    expect(msToHours(HOUR * 7.98)).toBe(8);
  });
});

describe('formatHours', () => {
  it('writes whole and part hours the way a person says them', () => {
    expect(formatHours(7.5)).toBe('7.5h');
    expect(formatHours(0)).toBe('0h');
  });

  it('drops to minutes below an hour, where a decimal hour stops meaning anything', () => {
    // "0.4h" is a number nobody converts in their head.
    expect(formatHours(0.4)).toBe('24m');
  });
});
