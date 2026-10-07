import { describe, expect, it } from 'vitest';
import { deviceTimezone } from '../../src/timezone';
import {
  formatDateTime,
  formatDayInZone,
  formatDayLabel,
  formatElapsed,
  offsetLabel,
  offsetMinutes,
  timezoneNames,
} from '../../src/time';

const INSTANT = '2026-02-03T18:45:00.000Z';

describe('formatDateTime', () => {
  it('renders the full instant in the chosen zone', () => {
    expect(formatDateTime(INSTANT, 'UTC')).toBe('Tue 3 Feb, 6:45 PM');
    expect(formatDateTime(INSTANT, 'Asia/Kolkata')).toBe('Wed 4 Feb, 12:15 AM');
  });

  it('hands back an unparseable timestamp untouched', () => {
    expect(formatDateTime('garbage', 'UTC')).toBe('garbage');
  });
});

describe('formatDayInZone', () => {
  it('hands back an unparseable timestamp untouched', () => {
    expect(formatDayInZone('garbage', 'UTC')).toBe('garbage');
  });
});

describe('formatDayLabel', () => {
  it('returns a value that is not a day key as it came', () => {
    expect(formatDayLabel('03/02/2026')).toBe('03/02/2026');
  });
});

describe('formatElapsed', () => {
  it('rounds under a minute to "Just now", and never goes negative', () => {
    expect(formatElapsed(59_999)).toBe('Just now');
    expect(formatElapsed(-60_000)).toBe('Just now');
  });

  it('steps from minutes to hours to days', () => {
    expect(formatElapsed(59 * 60_000)).toBe('59m ago');
    expect(formatElapsed(60 * 60_000)).toBe('1h ago');
    expect(formatElapsed(23 * 3_600_000 + 59 * 60_000)).toBe('23h ago');
    expect(formatElapsed(24 * 3_600_000)).toBe('1d ago');
    expect(formatElapsed(73 * 3_600_000)).toBe('3d ago');
  });
});

describe('offsetLabel / offsetMinutes', () => {
  const midWinter = new Date('2026-01-15T12:00:00.000Z');

  it('gives no label for a zone this runtime cannot resolve', () => {
    expect(offsetLabel('Mars/Olympus_Mons', midWinter)).toBe('');
  });

  it('measures the offset in minutes, east positive', () => {
    expect(offsetMinutes('Asia/Kolkata', midWinter)).toBe(330);
    expect(offsetMinutes('America/New_York', midWinter)).toBe(-300);
    expect(offsetMinutes('UTC', midWinter)).toBe(0);
  });
});

describe('timezoneNames', () => {
  it('drops a current zone that is not a real zone, but keeps this device', () => {
    const names = timezoneNames('Not/A_Zone', ['Europe/Paris']);
    expect(names).not.toContain('Not/A_Zone');
    expect(names).toContain('Europe/Paris');
    expect(names).toContain(deviceTimezone());
  });
});
