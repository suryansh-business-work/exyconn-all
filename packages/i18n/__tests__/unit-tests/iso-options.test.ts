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
  it('lists every currency the runtime knows, labelled code first with its name and sign', () => {
    const options = currencyOptions('en');
    const rupee = options.find((option) => option.code === 'INR');

    expect(options).toHaveLength(Intl.supportedValuesOf('currency').length);
    expect(rupee).toEqual({
      code: 'INR',
      name: 'Indian Rupee',
      symbol: '₹',
      minorUnits: 2,
      label: 'INR — Indian Rupee (₹)',
    });
  });

  it('carries the minor units ISO 4217 gives each currency', () => {
    const units = new Map(currencyOptions('en').map((option) => [option.code, option.minorUnits]));

    expect(units.get('JPY')).toBe(0);
    expect(units.get('USD')).toBe(2);
    expect(units.get('KWD')).toBe(3);
  });

  it('leaves the sign out of the label when the currency is written with its code', () => {
    const franc = currencyOptions('en').find((option) => option.code === 'CHF');

    expect(franc?.symbol).toBe('CHF');
    expect(franc?.label).toBe('CHF — Swiss Franc');
  });

  it('names currencies in the language asked for', () => {
    const dollar = currencyOptions('de').find((option) => option.code === 'USD');

    expect(dollar?.label).toBe('USD — US-Dollar ($)');
  });

  it('is sorted by label, which puts it in code order', () => {
    const options = currencyOptions('en');

    expect(isSortedByLabel(options)).toBe(true);
    expect(options[0].code.localeCompare(options[1].code)).toBeLessThan(0);
  });

  it('falls back to the code, and no minor units, when the runtime has nothing for it', () => {
    vi.spyOn(Intl.DisplayNames.prototype, 'of').mockReturnValue(undefined);
    vi.spyOn(Intl.NumberFormat.prototype, 'formatToParts').mockReturnValue([]);
    vi.spyOn(Intl.NumberFormat.prototype, 'resolvedOptions').mockReturnValue(
      {} as Intl.ResolvedNumberFormatOptions,
    );

    const euro = currencyOptions('en').find((option) => option.code === 'EUR');

    expect(euro).toEqual({
      code: 'EUR',
      name: 'EUR',
      symbol: 'EUR',
      minorUnits: 0,
      label: 'EUR — EUR',
    });
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
