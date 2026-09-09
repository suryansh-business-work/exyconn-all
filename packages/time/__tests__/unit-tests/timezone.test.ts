import { describe, expect, it } from 'vitest';
import {
  FALLBACK_TIMEZONE,
  isValidTimezone,
  offsetLabel,
  resolveEffectiveTimezone,
  timezoneOptionLabel,
  timezoneOptions,
} from '../../src/timezone';

describe('isValidTimezone', () => {
  it('accepts the two zones the supported-values list would wrongly reject', () => {
    // `Intl.supportedValuesOf('timeZone')` is the PRE-canonicalisation list: it carries
    // Asia/Calcutta but not Asia/Kolkata, and no UTC at all. Membership-testing against it
    // would reject both of these, which people are already saved with.
    expect(isValidTimezone('Asia/Kolkata')).toBe(true);
    expect(isValidTimezone('UTC')).toBe(true);
  });

  it('rejects nonsense, empty and absent zones', () => {
    expect(isValidTimezone('Mars/Olympus_Mons')).toBe(false);
    expect(isValidTimezone('')).toBe(false);
    expect(isValidTimezone(null)).toBe(false);
    expect(isValidTimezone(undefined)).toBe(false);
  });
});

describe('resolveEffectiveTimezone', () => {
  it('prefers the person’s own pick over everything else', () => {
    expect(
      resolveEffectiveTimezone({
        userTimezone: 'Asia/Kolkata',
        defaultTimezone: 'Europe/London',
        deviceTimezone: 'America/New_York',
      }),
    ).toBe('Asia/Kolkata');
  });

  it('falls to the workspace default, then the device', () => {
    expect(
      resolveEffectiveTimezone({ defaultTimezone: 'Europe/London', deviceTimezone: 'UTC' }),
    ).toBe('Europe/London');
    expect(resolveEffectiveTimezone({ deviceTimezone: 'America/New_York' })).toBe(
      'America/New_York',
    );
  });

  it('skips a candidate that is not resolvable rather than trusting it', () => {
    // The device zone is client-supplied and never validated on the way in. One machine
    // reporting nonsense must not poison every timestamp that person sees.
    expect(
      resolveEffectiveTimezone({ userTimezone: 'Mars/Base', defaultTimezone: 'Europe/London' }),
    ).toBe('Europe/London');
  });

  it('lands on UTC when nothing resolves', () => {
    expect(resolveEffectiveTimezone({})).toBe(FALLBACK_TIMEZONE);
    expect(resolveEffectiveTimezone({ userTimezone: null, defaultTimezone: '' })).toBe('UTC');
  });
});

describe('offsetLabel', () => {
  it('reports the offset for a zone at a given moment', () => {
    // Kolkata has no daylight saving, so this is stable in every season.
    expect(offsetLabel('Asia/Kolkata', new Date('2026-02-03T00:00:00Z'))).toBe('GMT+05:30');
  });

  it('moves with daylight saving, which is why it takes a date', () => {
    const winter = offsetLabel('Europe/London', new Date('2026-01-15T12:00:00Z'));
    const summer = offsetLabel('Europe/London', new Date('2026-07-15T12:00:00Z'));

    expect(winter).not.toBe(summer);
  });

  it('never throws on an unresolvable zone', () => {
    expect(offsetLabel('Mars/Base')).toBe(FALLBACK_TIMEZONE);
  });
});

describe('timezoneOptions', () => {
  it('always offers UTC, which the platform list omits entirely', () => {
    expect(timezoneOptions().some((option) => option.value === 'UTC')).toBe(true);
  });

  it('includes the zone already saved, so a picker is never blank', () => {
    // A value absent from its own options is a value MUI cannot render.
    const options = timezoneOptions('Asia/Kolkata');

    expect(options.some((option) => option.value === 'Asia/Kolkata')).toBe(true);
  });

  it('ignores a saved zone that is not real', () => {
    expect(timezoneOptions('Mars/Base').some((option) => option.value === 'Mars/Base')).toBe(false);
  });

  it('labels an option with its zone and offset', () => {
    expect(timezoneOptionLabel('Asia/Kolkata', new Date('2026-02-03T00:00:00Z'))).toBe(
      'Asia/Kolkata (GMT+05:30)',
    );
  });
});
