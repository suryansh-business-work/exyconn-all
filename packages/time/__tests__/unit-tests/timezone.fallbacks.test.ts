import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  FALLBACK_TIMEZONE,
  offsetLabel,
  timezoneOptionLabel,
  timezoneOptions,
} from '../../src/timezone';

const JANUARY = new Date('2026-01-15T12:00:00Z');
const JULY = new Date('2026-07-15T12:00:00Z');
/** ICU spells a zero offset "GMT" in older releases and "GMT+00:00" in newer ones. */
const ZERO_OFFSET = /^GMT(\+00:00)?$/;

describe('offsetLabel fallbacks', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('falls back to UTC when the formatter yields no timeZoneName part', () => {
    vi.spyOn(Intl.DateTimeFormat.prototype, 'formatToParts').mockReturnValue([
      { type: 'literal', value: '1/15/2026' },
    ]);

    expect(offsetLabel('Asia/Kolkata', JANUARY)).toBe(FALLBACK_TIMEZONE);
  });

  it('falls back to UTC for an unresolvable zone instead of throwing', () => {
    expect(offsetLabel('Not/AZone', JANUARY)).toBe(FALLBACK_TIMEZONE);
  });

  it('labels UTC itself with a zero offset', () => {
    expect(offsetLabel('UTC', JULY)).toMatch(ZERO_OFFSET);
    expect(offsetLabel('Europe/London', JANUARY)).toMatch(ZERO_OFFSET);
  });
});

describe('default moment is "now"', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('offsetLabel reads the current moment when no date is given', () => {
    vi.setSystemTime(JANUARY);
    expect(offsetLabel('America/New_York')).toBe('GMT-05:00');

    vi.setSystemTime(JULY);
    expect(offsetLabel('America/New_York')).toBe('GMT-04:00');
  });

  it('timezoneOptionLabel reads the current moment when no date is given', () => {
    vi.setSystemTime(JANUARY);
    expect(timezoneOptionLabel('America/New_York')).toBe('America/New_York (GMT-05:00)');

    vi.setSystemTime(JULY);
    expect(timezoneOptionLabel('America/New_York')).toBe('America/New_York (GMT-04:00)');
  });

  it('timezoneOptions labels every zone at the current moment when no date is given', () => {
    vi.setSystemTime(JULY);
    const options = timezoneOptions();

    expect(options.find((option) => option.value === 'America/New_York')?.label).toBe(
      'America/New_York (GMT-04:00)',
    );
  });
});

describe('timezoneOptions contents', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses the given moment for every label', () => {
    const options = timezoneOptions('', JANUARY);

    expect(options.find((option) => option.value === 'America/New_York')?.label).toBe(
      'America/New_York (GMT-05:00)',
    );
    expect(options.find((option) => option.value === 'UTC')?.label).toBe(
      `UTC (${offsetLabel('UTC', JANUARY)})`,
    );
  });

  it('comes back sorted by zone name with no duplicates', () => {
    const values = timezoneOptions('UTC', JANUARY).map((option) => option.value);
    const sorted = [...values].sort((a, b) => a.localeCompare(b));

    expect(values).toEqual(sorted);
    expect(new Set(values).size).toBe(values.length);
  });

  it('unions in a valid saved zone that the platform list omits', () => {
    vi.spyOn(Intl, 'supportedValuesOf').mockReturnValue(['Europe/London', 'Asia/Calcutta']);

    expect(timezoneOptions('Asia/Kolkata', JANUARY).map((option) => option.value)).toEqual([
      'Asia/Calcutta',
      'Asia/Kolkata',
      'Europe/London',
      'UTC',
    ]);
  });

  it('offers only the platform list plus UTC when no zone is saved', () => {
    vi.spyOn(Intl, 'supportedValuesOf').mockReturnValue(['Europe/London']);

    const zero = offsetLabel('UTC', JANUARY);

    expect(timezoneOptions(undefined, JANUARY)).toEqual([
      { value: 'Europe/London', label: `Europe/London (${zero})` },
      { value: 'UTC', label: `UTC (${zero})` },
    ]);
  });

  it('leaves out a saved zone that does not resolve', () => {
    vi.spyOn(Intl, 'supportedValuesOf').mockReturnValue(['Europe/London']);

    expect(timezoneOptions('Mars/Base', JANUARY).map((option) => option.value)).toEqual([
      'Europe/London',
      'UTC',
    ]);
  });
});
