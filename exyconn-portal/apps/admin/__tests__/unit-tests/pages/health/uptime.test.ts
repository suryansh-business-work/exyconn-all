import { describe, expect, it } from 'vitest';
import { formatUptime } from '../../../../src/pages/health/uptime';

describe('formatUptime', () => {
  it('shows seconds alone under a minute, never below zero', () => {
    expect(formatUptime(0)).toBe('0s');
    expect(formatUptime(42.4)).toBe('42s');
    expect(formatUptime(-5)).toBe('0s');
  });

  it('switches to minutes and seconds at one minute', () => {
    expect(formatUptime(60)).toBe('1m 0s');
    expect(formatUptime(750)).toBe('12m 30s');
    expect(formatUptime(3599)).toBe('59m 59s');
  });

  it('rounds a fractional uptime once, so the units never disagree', () => {
    // process.uptime() is fractional: 59.6s is a minute, and 119.6s is two — not "1m 0s".
    expect(formatUptime(59.6)).toBe('1m 0s');
    expect(formatUptime(119.6)).toBe('2m 0s');
    expect(formatUptime(90.6)).toBe('1m 31s');
  });

  it('shows hours and minutes from one hour', () => {
    expect(formatUptime(3600)).toBe('1h 0m');
    expect(formatUptime(86_399)).toBe('23h 59m');
  });

  it('shows days and hours from one day', () => {
    expect(formatUptime(86_400)).toBe('1d 0h');
    expect(formatUptime(4 * 86_400 + 6 * 3600 + 59)).toBe('4d 6h');
  });
});
