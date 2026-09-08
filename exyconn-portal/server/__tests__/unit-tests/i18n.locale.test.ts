import {
  FALLBACK_LOCALE,
  canonicalLocale,
  directionOf,
  endonymOf,
  isValidLocale,
  resolveEffectiveLocale,
} from '../../src/modules/i18n/locale.constants';
import { parseTranslations } from '../../src/modules/i18n/i18n.translate';
import { translationKey } from '../../src/modules/i18n/translation.model';

describe('locale tags', () => {
  it('canonicalises the ways people write the same locale', () => {
    // Without this, en-US, EN-us and en_US become three rows for one language.
    expect(canonicalLocale('en-US')).toBe('en-US');
    expect(canonicalLocale('EN-us')).toBe('en-US');
    expect(canonicalLocale('en_US')).toBe('en-US');
  });

  it('refuses a tag the runtime cannot resolve', () => {
    expect(isValidLocale('not a locale')).toBe(false);
    expect(canonicalLocale('')).toBeNull();
    expect(canonicalLocale(null)).toBeNull();
  });

  it('accepts the long tail, not just a shortlist', () => {
    // There is deliberately no hardcoded list of supported languages.
    for (const tag of ['hi', 'ar', 'pt-BR', 'zh-Hans', 'sw', 'is']) {
      expect(isValidLocale(tag)).toBe(true);
    }
  });
});

describe('the locale a person is shown', () => {
  it('prefers their own choice over the workspace default', () => {
    expect(
      resolveEffectiveLocale({ userLocale: 'hi', defaultLocale: 'en', requestLocale: 'fr' }),
    ).toBe('hi');
  });

  it('falls back to the workspace default, then the browser, then English', () => {
    expect(resolveEffectiveLocale({ defaultLocale: 'de', requestLocale: 'fr' })).toBe('de');
    expect(resolveEffectiveLocale({ requestLocale: 'fr' })).toBe('fr');
    expect(resolveEffectiveLocale({})).toBe(FALLBACK_LOCALE);
  });

  it('skips a candidate that does not resolve rather than trusting it', () => {
    // The browser's tag is client-supplied and never validated on the way in.
    expect(resolveEffectiveLocale({ userLocale: 'gibberish!', defaultLocale: 'ja' })).toBe('ja');
  });
});

describe('script direction', () => {
  it('reads right-to-left for right-to-left languages, region and script tags included', () => {
    for (const tag of ['ar', 'ar-EG', 'he', 'fa', 'ur-PK']) {
      expect(directionOf(tag)).toBe('rtl');
    }
  });

  it('reads left-to-right for everything else', () => {
    for (const tag of ['en', 'hi', 'ja', 'pt-BR']) {
      expect(directionOf(tag)).toBe('ltr');
    }
  });
});

describe('language names', () => {
  it('names a language in its own words, not in English', () => {
    // A picker listing every language in English is useless to the person who needs it.
    expect(endonymOf('de')).toBe('Deutsch');
    expect(endonymOf('hi')).toBe('हिन्दी');
  });
});

describe('translation keys', () => {
  it('keys a string by its own content, so the same sentence is one row', () => {
    expect(translationKey('Save changes')).toBe(translationKey('Save changes'));
    expect(translationKey('Save changes')).not.toBe(translationKey('Save Changes'));
  });
});

describe('reading the model’s answer', () => {
  it('accepts a clean JSON array', () => {
    expect(parseTranslations('["Speichern", "Abbrechen"]', 2)).toEqual(['Speichern', 'Abbrechen']);
  });

  it('digs the array out of a chatty reply', () => {
    expect(parseTranslations('Sure! ["Speichern"] — hope that helps', 1)).toEqual(['Speichern']);
  });

  it('discards a reply of the wrong length rather than zipping it up short', () => {
    // A shifted array puts the label for "Delete" on the "Save" button.
    expect(parseTranslations('["Speichern"]', 2)).toBeNull();
  });

  it('discards a reply with a blank or non-string entry', () => {
    expect(parseTranslations('["Speichern", ""]', 2)).toBeNull();
    expect(parseTranslations('["Speichern", 7]', 2)).toBeNull();
  });

  it('discards anything that is not an array at all', () => {
    expect(parseTranslations('I cannot translate that.', 1)).toBeNull();
  });
});
