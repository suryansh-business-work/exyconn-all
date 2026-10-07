import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  FALLBACK_LOCALE,
  browserLocale,
  canonicalLocale,
  directionOf,
  endonymOf,
  isValidLocale,
} from '../../src/locale';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('browserLocale', () => {
  it('reads the browser language, canonicalised', () => {
    vi.stubGlobal('navigator', { language: 'de_de' });

    expect(browserLocale()).toBe('de-DE');
  });

  it('falls back to English when the browser reports an unusable language', () => {
    vi.stubGlobal('navigator', { language: 'not a locale' });

    expect(browserLocale()).toBe(FALLBACK_LOCALE);
  });

  it('falls back to English when the browser reports no language', () => {
    vi.stubGlobal('navigator', { language: '' });

    expect(browserLocale()).toBe(FALLBACK_LOCALE);
  });

  it('falls back to English where there is no navigator at all', () => {
    vi.stubGlobal('navigator', undefined);

    expect(browserLocale()).toBe(FALLBACK_LOCALE);
  });
});

describe('canonicalLocale edges', () => {
  it('treats undefined and the empty string as no locale', () => {
    expect(canonicalLocale(undefined)).toBeNull();
    expect(canonicalLocale('')).toBeNull();
    expect(isValidLocale('')).toBe(false);
  });

  it('accepts a bare language and a script subtag', () => {
    expect(canonicalLocale('FR')).toBe('fr');
    expect(canonicalLocale('zh-hant-tw')).toBe('zh-Hant-TW');
    expect(isValidLocale('hi-IN')).toBe(true);
  });

  it('is null when the runtime resolves the tag to nothing', () => {
    vi.spyOn(Intl, 'getCanonicalLocales').mockReturnValue([]);

    expect(canonicalLocale('en')).toBeNull();
  });
});

describe('directionOf edges', () => {
  it('runs left-to-right for a tag it cannot resolve', () => {
    expect(directionOf('not a locale')).toBe('ltr');
  });

  it('reads the language subtag whatever its case', () => {
    expect(directionOf('HE-il')).toBe('rtl');
    expect(directionOf('fa')).toBe('rtl');
  });
});

describe('endonymOf edges', () => {
  it('names English in English for a tag it cannot resolve', () => {
    expect(endonymOf('not a locale')).toBe('English');
  });

  it('hands back the tag when the runtime has no name for it', () => {
    vi.spyOn(Intl.DisplayNames.prototype, 'of').mockReturnValue(undefined);

    expect(endonymOf('de')).toBe('de');
  });

  it('hands back the tag when the runtime cannot name languages at all', () => {
    vi.spyOn(Intl, 'DisplayNames').mockImplementation(function () {
      throw new RangeError('Unsupported');
    });

    expect(endonymOf('ja-JP')).toBe('ja-JP');
  });
});
