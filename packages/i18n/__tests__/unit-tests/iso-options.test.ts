import { afterEach, describe, expect, it, vi } from 'vitest';
import { setActiveFormatSettings } from '../../src/active-settings';
import { DEFAULT_FORMAT_SETTINGS } from '../../src/format';
import { countryName, countryOptions, currencyOptions } from '../../src/iso';

/** Whether a list is in the order `localeCompare` puts its labels in. */
function isSortedByLabel(options: ReadonlyArray<{ label: string }>): boolean {
  return options.every((option, index) => {
    const previous = options[index - 1];
    return previous === undefined || previous.label.localeCompare(option.label) <= 0;
  });
}

afterEach(() => {
  vi.restoreAllMocks();
  setActiveFormatSettings(DEFAULT_FORMAT_SETTINGS);
});

describe('currencyOptions', () => {
  it('lists every currency the runtime knows, named and coded in the label', () => {
    const options = currencyOptions('en');
    const euro = options.find((option) => option.code === 'EUR');

    expect(options).toHaveLength(Intl.supportedValuesOf('currency').length);
    expect(euro?.label).toBe('Euro (EUR)');
  });

  it('names currencies in the language asked for', () => {
    const dollar = currencyOptions('de').find((option) => option.code === 'USD');

    expect(dollar?.label).toBe('US-Dollar (USD)');
  });

  it('is sorted by label so a picker reads alphabetically', () => {
    expect(isSortedByLabel(currencyOptions('en'))).toBe(true);
  });

  it('falls back to the code when the runtime has no name for it', () => {
    vi.spyOn(Intl.DisplayNames.prototype, 'of').mockReturnValue(undefined);

    const euro = currencyOptions('en').find((option) => option.code === 'EUR');

    expect(euro?.label).toBe('EUR (EUR)');
  });

  it('refuses a locale tag the runtime cannot parse', () => {
    expect(() => currencyOptions('not a locale')).toThrow(RangeError);
  });
});

describe('countryOptions', () => {
  it('lists assigned two-letter regions, named in the language asked for', () => {
    const options = countryOptions('en');
    const codes = new Set(options.map((option) => option.code));

    expect(options.find((option) => option.code === 'IN')?.label).toBe('India');
    expect(countryOptions('de').find((option) => option.code === 'DE')?.label).toBe('Deutschland');
    expect(codes.has('DE')).toBe(true);
  });

  it('drops the codes ICU does not recognise', () => {
    const codes = new Set(countryOptions('en').map((option) => option.code));

    expect(codes.has('AA')).toBe(false);
    expect(codes.has('QQ')).toBe(false);
    expect(codes.size).toBeLessThan(26 * 26);
  });

  it('is sorted by label', () => {
    expect(isSortedByLabel(countryOptions('en'))).toBe(true);
  });

  it('drops a code the runtime returns no name for at all', () => {
    const real = Intl.DisplayNames.prototype.of;
    vi.spyOn(Intl.DisplayNames.prototype, 'of').mockImplementation(function (
      this: Intl.DisplayNames,
      code: string,
    ) {
      return code === 'IN' ? undefined : real.call(this, code);
    });

    const codes = new Set(countryOptions('en').map((option) => option.code));

    expect(codes.has('IN')).toBe(false);
    expect(codes.has('DE')).toBe(true);
  });
});

describe('countryName', () => {
  it('defaults to the workspace language when no locale is given', () => {
    setActiveFormatSettings({ ...DEFAULT_FORMAT_SETTINGS, locale: 'de' });

    expect(countryName('IN')).toBe('Indien');
  });

  it('hands back the code when the runtime has no name for it', () => {
    vi.spyOn(Intl.DisplayNames.prototype, 'of').mockReturnValue(undefined);

    expect(countryName('IN', 'en')).toBe('IN');
  });

  it('hands back an unrecognised code unchanged', () => {
    expect(countryName('AA', 'en')).toBe('AA');
  });
});
