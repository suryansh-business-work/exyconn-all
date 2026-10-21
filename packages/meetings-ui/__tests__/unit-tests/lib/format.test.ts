import { describe, expect, it } from 'vitest';
import { confidencePercent, formatOffset, formatSeconds } from '../../../src/lib/format';

describe('formatSeconds', () => {
  it('writes a call length in hours and minutes', () => {
    expect(formatSeconds(5400)).toBe('1h 30m');
    expect(formatSeconds(59)).toBe('0m');
    expect(formatSeconds(2700)).toBe('45m');
  });
});

describe('formatOffset', () => {
  it('reads like a recording timestamp, with hours only past the first hour', () => {
    expect(formatOffset(0)).toBe('0:00');
    expect(formatOffset(61_000)).toBe('1:01');
    expect(formatOffset(599_999)).toBe('9:59');
    expect(formatOffset(3_729_000)).toBe('1:02:09');
  });
});

describe('confidencePercent', () => {
  it('rounds a 0–1 confidence to a whole percentage', () => {
    expect(confidencePercent(0.874)).toBe(87);
    expect(confidencePercent(1)).toBe(100);
    expect(confidencePercent(0)).toBe(0);
  });
});
