import { describe, expect, it } from 'vitest';
import {
  FALLBACK_LOCALE,
  canonicalLocale,
  directionOf,
  endonymOf,
  isValidLocale,
  resolveEffectiveLocale,
} from '../../src/locale';
import {
  FALLBACK_TIMEZONE,
  isValidTimezone,
  offsetLabel,
  resolveEffectiveTimezone,
  timezoneOptionLabel,
} from '../../src/timezone';

describe('locale tags in the browser', () => {
  it('canonicalises the ways people write the same locale', () => {
    expect(canonicalLocale('EN-us')).toBe('en-US');
    expect(canonicalLocale('en_US')).toBe('en-US');
  });

  it('refuses a tag the runtime cannot resolve', () => {
    expect(isValidLocale('not a locale')).toBe(false);
    expect(canonicalLocale(null)).toBeNull();
  });
});

describe('the locale a screen renders in', () => {
  it('prefers the person’s own choice over the workspace default', () => {
    expect(
      resolveEffectiveLocale({ userLocale: 'hi', defaultLocale: 'en', browserLocale: 'fr' }),
    ).toBe('hi');
  });

  it('falls back to the workspace default, then the browser, then English', () => {
    expect(resolveEffectiveLocale({ defaultLocale: 'de', browserLocale: 'fr' })).toBe('de');
    expect(resolveEffectiveLocale({ browserLocale: 'fr' })).toBe('fr');
    expect(resolveEffectiveLocale({})).toBe(FALLBACK_LOCALE);
  });

  it('agrees with the server: an unresolvable candidate is skipped, not trusted', () => {
    expect(resolveEffectiveLocale({ userLocale: 'gibberish!', defaultLocale: 'ja' })).toBe('ja');
  });
});

describe('script direction', () => {
  it('reads right-to-left for right-to-left languages', () => {
    expect(directionOf('ar-EG')).toBe('rtl');
    expect(directionOf('ur-PK')).toBe('rtl');
  });

  it('reads left-to-right for everything else', () => {
    expect(directionOf('pt-BR')).toBe('ltr');
  });
});

describe('language names', () => {
  it('names a language in its own words', () => {
    expect(endonymOf('de')).toBe('Deutsch');
  });
});

describe('the zone a screen renders in', () => {
  it('prefers the person’s own choice, then the workspace, then the device', () => {
    expect(
      resolveEffectiveTimezone({
        userTimezone: 'Europe/Berlin',
        defaultTimezone: 'Asia/Kolkata',
        deviceTimezone: 'America/New_York',
      }),
    ).toBe('Europe/Berlin');
    expect(
      resolveEffectiveTimezone({ defaultTimezone: 'Asia/Kolkata', deviceTimezone: 'UTC' }),
    ).toBe('Asia/Kolkata');
    expect(resolveEffectiveTimezone({})).toBe(FALLBACK_TIMEZONE);
  });

  it('skips a zone the runtime cannot resolve rather than poisoning every timestamp', () => {
    expect(
      resolveEffectiveTimezone({ userTimezone: 'Mars/Olympus', defaultTimezone: 'Europe/Rome' }),
    ).toBe('Europe/Rome');
  });

  it('accepts the canonical names Intl.supportedValuesOf omits', () => {
    // Asia/Kolkata and UTC are both missing from that list; both are perfectly valid.
    expect(isValidTimezone('Asia/Kolkata')).toBe(true);
    expect(isValidTimezone('UTC')).toBe(true);
  });
});

describe('zone labels', () => {
  const winter = new Date('2026-01-15T12:00:00.000Z');

  it('shows the offset that applies at that moment', () => {
    expect(offsetLabel('Asia/Kolkata', winter)).toBe('GMT+05:30');
  });

  it('labels a picker entry with its zone and offset', () => {
    expect(timezoneOptionLabel('Asia/Kolkata', winter)).toBe('Asia/Kolkata (GMT+05:30)');
  });
});
