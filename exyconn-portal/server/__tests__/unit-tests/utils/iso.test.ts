import {
  countryName,
  currencyName,
  isValidCountry,
  isValidCurrency,
  normalizeCurrency,
  supportedCurrencies,
} from '../../../src/utils/iso';

afterEach(() => {
  jest.restoreAllMocks();
});

describe('supportedCurrencies', () => {
  it('lists the ISO 4217 codes the runtime knows, sorted', () => {
    const codes = supportedCurrencies();
    expect(codes).toEqual(expect.arrayContaining(['EUR', 'INR', 'USD']));
    expect(codes).toEqual([...codes].sort((a, b) => a.localeCompare(b)));
  });
});

describe('isValidCountry', () => {
  it('accepts a real alpha-2 country', () => {
    expect(isValidCountry('IN')).toBe(true);
    expect(isValidCountry('DE')).toBe(true);
  });

  it('rejects an invented code the runtime echoes back', () => {
    expect(isValidCountry('XX')).toBe(false);
  });

  it.each(['in', 'IND', 'I', ''])('rejects the malformed code %p', (code) => {
    expect(isValidCountry(code)).toBe(false);
  });
});

describe('isValidCurrency', () => {
  it('accepts a real code and rejects lower case, unknown and malformed ones', () => {
    expect(isValidCurrency('USD')).toBe(true);
    expect(isValidCurrency('usd')).toBe(false);
    expect(isValidCurrency('XYZ')).toBe(false);
    expect(isValidCurrency('US')).toBe(false);
  });
});

describe('normalizeCurrency', () => {
  it('trims and upper-cases a stored code', () => {
    expect(normalizeCurrency(' inr ')).toBe('INR');
  });

  it.each([['₹'], [''], [null], [undefined], ['dollars']])(
    'returns null for %p, which names no currency',
    (value) => {
      expect(normalizeCurrency(value)).toBeNull();
    },
  );
});

describe('display names', () => {
  it('names a country and a currency in the reader language', () => {
    expect(countryName('IN')).toBe('India');
    expect(countryName('DE', 'de')).toBe('Deutschland');
    expect(currencyName('INR')).toBe('Indian Rupee');
  });

  it('falls back to the code when the runtime has no name for it', () => {
    jest.spyOn(Intl.DisplayNames.prototype, 'of').mockReturnValue(undefined);
    expect(countryName('IN')).toBe('IN');
    expect(currencyName('INR')).toBe('INR');
  });
});
