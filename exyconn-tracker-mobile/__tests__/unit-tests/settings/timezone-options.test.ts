import { describe, expect, it } from 'vitest';
import { offsetLabel, offsetMinutes } from '@exyconn/tracker-core';
import { timezoneOptions } from '../../../src/lib/settings/timezone-options';

/** A fixed instant, so daylight saving cannot move a zone between runs. */
const AT = new Date('2026-01-15T12:00:00Z');

/** What the portal's `trackerTimezones` returns: the server runtime's list (Node has one). */
const SUPPORTED = Intl.supportedValuesOf('timeZone');

describe('timezoneOptions', () => {
  const options = timezoneOptions('Asia/Kolkata', SUPPORTED, AT);

  it('includes the current zone even when the runtime lists only its old alias', () => {
    expect(options.some((option) => option.value === 'Asia/Kolkata')).toBe(true);
  });

  it('captions every zone with its offset at that instant', () => {
    const kolkata = options.find((option) => option.value === 'Asia/Kolkata');
    expect(kolkata).toEqual({
      value: 'Asia/Kolkata',
      label: 'Asia/Kolkata',
      caption: offsetLabel('Asia/Kolkata', AT),
    });
    expect(kolkata?.caption).toBe('UTC+05:30');
  });

  it('orders zones west to east by offset, then by name', () => {
    for (let index = 1; index < options.length; index += 1) {
      const before = options[index - 1];
      const after = options[index];
      const gap = offsetMinutes(after.value, AT) - offsetMinutes(before.value, AT);
      expect(gap).toBeGreaterThanOrEqual(0);
      if (gap === 0) {
        expect(before.value.localeCompare(after.value)).toBeLessThan(0);
      }
    }
  });

  it('lists each zone once', () => {
    const values = options.map((option) => option.value);
    expect(new Set(values).size).toBe(values.length);
  });
});
