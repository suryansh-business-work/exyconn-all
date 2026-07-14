import { describe, it, expect } from 'vitest';
import {
  dayBounds,
  formatDayInZone,
  formatDayLabel,
  formatLastSync,
  formatMonthLabel,
  formatTimeOfDay,
  monthBounds,
  offsetLabel,
  timezoneNames,
} from './time';

/** 03 Feb 2026, 18:45 UTC — late evening in London, past midnight in Kolkata. */
const INSTANT = '2026-02-03T18:45:00.000Z';

describe('formatTimeOfDay', () => {
  it('reads the SAME instant in whichever zone the employee chose', () => {
    expect(formatTimeOfDay(INSTANT, 'UTC')).toBe('6:45 PM');
    expect(formatTimeOfDay(INSTANT, 'America/New_York')).toBe('1:45 PM');
    // +05:30 — the capture lands on the NEXT day for them. This is the whole point of the
    // feature: a screenshot stamped "6:45 PM" for someone whose day ended at 00:15 is a lie.
    expect(formatTimeOfDay(INSTANT, 'Asia/Kolkata')).toBe('12:15 AM');
  });

  it('hands back an unparseable timestamp instead of rendering "Invalid Date"', () => {
    expect(formatTimeOfDay('not-a-date', 'UTC')).toBe('not-a-date');
  });
});

describe('formatDayInZone', () => {
  it('resolves an instant to the day it falls on IN that zone', () => {
    expect(formatDayInZone(INSTANT, 'UTC')).toBe('Tue 3 Feb');
    expect(formatDayInZone(INSTANT, 'Asia/Kolkata')).toBe('Wed 4 Feb');
  });
});

describe('formatDayLabel', () => {
  it('treats a portal day key as a CALENDAR date, never as an instant', () => {
    // The portal already bucketed this day using the employee's zone. Re-zoning it would move
    // it: read as an instant (UTC midnight), 2026-02-03 is still 2 Feb anywhere west of UTC —
    // which is how a report row ends up labelled with the wrong day.
    expect(formatDayLabel('2026-02-03')).toBe('Tue 3 Feb');
    expect(formatDayInZone('2026-02-03T00:00:00.000Z', 'America/Los_Angeles')).toBe('Mon 2 Feb');
  });

  it('accepts the Date the calendar hands it, and a full ISO day key', () => {
    expect(formatDayLabel(new Date(2026, 1, 3))).toBe('Tue 3 Feb');
    expect(formatDayLabel('2026-02-03T00:00:00.000Z')).toBe('Tue 3 Feb');
  });
});

describe('formatMonthLabel', () => {
  it('names the month for the switcher', () => {
    expect(formatMonthLabel(new Date(2026, 1, 1))).toBe('February 2026');
  });
});

describe('offsetLabel', () => {
  it('shows what each zone is offset by, so the picker is readable', () => {
    const midWinter = new Date('2026-01-15T12:00:00.000Z');
    expect(offsetLabel('UTC', midWinter)).toBe('UTC+00:00');
    expect(offsetLabel('Asia/Kolkata', midWinter)).toBe('UTC+05:30');
    expect(offsetLabel('America/New_York', midWinter)).toBe('UTC-05:00');
  });

  it('follows daylight saving rather than assuming a fixed offset', () => {
    const midSummer = new Date('2026-07-15T12:00:00.000Z');
    expect(offsetLabel('Europe/London', midSummer)).toBe('UTC+01:00');
    expect(offsetLabel('Europe/London', new Date('2026-01-15T12:00:00.000Z'))).toBe('UTC+00:00');
  });
});

describe('timezoneNames', () => {
  it('always contains the zone in force, so the Autocomplete can render its own value', () => {
    // `Intl.supportedValuesOf` omits both of these (it lists the legacy `Asia/Calcutta`, and no
    // `UTC`), yet the portal accepts and stores them. An Autocomplete whose value is missing
    // from its options renders empty — the employee's own zone would vanish from the picker.
    expect(timezoneNames('Asia/Kolkata')).toContain('Asia/Kolkata');
    expect(timezoneNames('UTC')).toContain('UTC');
  });

  it('is sorted, de-duplicated, and not a hardcoded list', () => {
    const names = timezoneNames('Europe/London');
    expect(names.length).toBeGreaterThan(300);
    expect(names).toContain('Europe/London');
    expect(new Set(names).size).toBe(names.length);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });
});

describe('formatLastSync', () => {
  const now = new Date('2026-02-03T19:00:00.000Z');

  it('says how long ago, and when — in the chosen zone', () => {
    expect(formatLastSync(INSTANT, 'UTC', now)).toBe('15m ago · 6:45 PM');
    expect(formatLastSync(INSTANT, 'Asia/Kolkata', now)).toBe('15m ago · 12:15 AM');
  });

  it('reports a sync that has never happened', () => {
    expect(formatLastSync(null, 'UTC', now)).toBe('Never');
    expect(formatLastSync('nonsense', 'UTC', now)).toBe('Never');
  });

  it('rounds recent syncs to "Just now"', () => {
    expect(formatLastSync('2026-02-03T18:59:30.000Z', 'UTC', now)).toBe('Just now · 6:59 PM');
  });
});

describe('dayBounds', () => {
  it('runs midnight to midnight IN the chosen zone, not on this computer', () => {
    // A Kolkata day starts at 18:30 UTC the day before. Using the device's midnight would
    // fetch a window shifted by 5.5 hours — half the employee's evening in the wrong day.
    expect(dayBounds(new Date(2026, 1, 3), 'Asia/Kolkata')).toEqual({
      startISO: '2026-02-02T18:30:00.000Z',
      endISO: '2026-02-03T18:30:00.000Z',
    });
    expect(dayBounds(new Date(2026, 1, 3), 'UTC')).toEqual({
      startISO: '2026-02-03T00:00:00.000Z',
      endISO: '2026-02-04T00:00:00.000Z',
    });
  });
});

describe('monthBounds', () => {
  it('spans the whole month in the chosen zone', () => {
    expect(monthBounds(new Date(2026, 1, 1), 'UTC')).toEqual({
      fromISO: '2026-02-01T00:00:00.000Z',
      toISO: '2026-03-01T00:00:00.000Z',
    });
    expect(monthBounds(new Date(2026, 11, 1), 'Asia/Kolkata')).toEqual({
      fromISO: '2026-11-30T18:30:00.000Z',
      toISO: '2026-12-31T18:30:00.000Z',
    });
  });
});
