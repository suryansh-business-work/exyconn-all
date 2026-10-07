import {
  FALLBACK_LOCALE,
  canonicalLocale,
  directionOf,
  endonymOf,
} from '../../../../src/modules/i18n/locale.constants';

afterEach(() => jest.restoreAllMocks());

describe('canonicalLocale', () => {
  it('is null when the runtime resolves the tag to nothing at all', () => {
    jest.spyOn(Intl, 'getCanonicalLocales').mockReturnValue([]);

    expect(canonicalLocale('de')).toBeNull();
  });
});

describe('directionOf', () => {
  it('reads a tag that does not resolve as the fallback language, left to right', () => {
    expect(directionOf('not a locale')).toBe('ltr');
  });
});

describe('endonymOf', () => {
  it('names a tag that does not resolve as the fallback language', () => {
    expect(endonymOf('not a locale')).toBe(endonymOf(FALLBACK_LOCALE));
    expect(endonymOf('not a locale')).toBe('English');
  });

  it('falls back to the tag itself when the runtime has no name for it', () => {
    jest
      .spyOn(Intl, 'DisplayNames')
      .mockImplementation(() => ({ of: () => undefined }) as unknown as Intl.DisplayNames);

    expect(endonymOf('pt-BR')).toBe('pt-BR');
  });

  it('falls back to the tag itself when the runtime cannot name languages at all', () => {
    jest.spyOn(Intl, 'DisplayNames').mockImplementation(() => {
      throw new RangeError('No locale data');
    });

    expect(endonymOf('sw')).toBe('sw');
  });
});
