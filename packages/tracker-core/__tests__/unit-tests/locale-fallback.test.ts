import { afterEach, describe, expect, it, vi } from 'vitest';
import { FALLBACK_LOCALE, canonicalLocale, deviceLocale } from '../../src/locale';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('deviceLocale fallback', () => {
  it('falls back to English when the OS reports a tag Intl cannot canonicalise', () => {
    vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({
      locale: '',
    } as Intl.ResolvedDateTimeFormatOptions);

    expect(deviceLocale()).toBe(FALLBACK_LOCALE);
    expect(FALLBACK_LOCALE).toBe('en');
  });
});

describe('canonicalLocale with an empty answer', () => {
  it('returns null when the runtime resolves the tag to nothing', () => {
    vi.spyOn(Intl, 'getCanonicalLocales').mockReturnValue([]);

    expect(canonicalLocale('en-US')).toBeNull();
  });
});
