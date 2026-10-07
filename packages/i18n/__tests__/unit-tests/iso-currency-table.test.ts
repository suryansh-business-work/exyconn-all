import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

type IsoModule = typeof import('../../src/iso');

const realSupportedValuesOf = Intl.supportedValuesOf;

/**
 * A fresh copy of iso.ts, whose once-read currency table is still unread, on an engine with
 * no `Intl.supportedValuesOf` (Hermes). The property goes only after the import: the module
 * loader itself still needs the real Intl.
 */
async function loadWithoutCurrencyTable(): Promise<IsoModule> {
  vi.resetModules();
  const iso = await import('../../src/iso');
  Reflect.deleteProperty(Intl, 'supportedValuesOf');
  return iso;
}

// The first load transforms iso.ts and its imports (date-fns-tz among them), which can
// outlast a test's timeout under coverage; every later fresh copy reuses that work.
beforeAll(async () => {
  await import('../../src/iso');
}, 30_000);

afterEach(() => {
  Object.defineProperty(Intl, 'supportedValuesOf', {
    value: realSupportedValuesOf,
    writable: true,
    configurable: true,
    enumerable: false,
  });
  vi.restoreAllMocks();
});

describe('normalizeCurrency on an engine with no currency table', () => {
  it('accepts a code Intl formats money in', async () => {
    const { normalizeCurrency } = await loadWithoutCurrencyTable();

    expect('supportedValuesOf' in Intl).toBe(false);
    expect(normalizeCurrency(' inr ')).toBe('INR');
    expect(normalizeCurrency('EUR')).toBe('EUR');
  });

  it('still refuses what is not shaped like a code, before asking Intl', async () => {
    const { normalizeCurrency } = await loadWithoutCurrencyTable();
    const numberFormat = vi.spyOn(Intl, 'NumberFormat');

    expect(normalizeCurrency('₹')).toBeNull();
    expect(normalizeCurrency(null)).toBeNull();
    expect(numberFormat).not.toHaveBeenCalled();
  });

  it('refuses a code Intl will not format, rather than throwing', async () => {
    const { normalizeCurrency } = await loadWithoutCurrencyTable();
    vi.spyOn(Intl, 'NumberFormat').mockImplementation(function () {
      throw new RangeError('Invalid currency code');
    });

    expect(normalizeCurrency('ABC')).toBeNull();
  });

  it('refuses a code Intl resolves to a different currency', async () => {
    const { normalizeCurrency } = await loadWithoutCurrencyTable();
    const real = Intl.NumberFormat;
    vi.spyOn(Intl, 'NumberFormat').mockImplementation(function (locale, options) {
      return new real(locale, { ...options, currency: 'USD' });
    });

    expect(normalizeCurrency('EUR')).toBeNull();
  });
});

describe('normalizeCurrency with a currency table', () => {
  it('reads the table once and answers from it afterwards', async () => {
    vi.resetModules();
    const { normalizeCurrency } = await import('../../src/iso');
    const supported = vi.spyOn(Intl, 'supportedValuesOf');

    expect(normalizeCurrency('JPY')).toBe('JPY');
    expect(normalizeCurrency('GBP')).toBe('GBP');
    expect(supported).toHaveBeenCalledTimes(1);
  });
});
