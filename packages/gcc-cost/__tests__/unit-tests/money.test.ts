import { describe, expect, it } from 'vitest';
import {
  convertFromInr,
  formatMoney,
  fromMinor,
  inrPerUnit,
  MissingRateError,
  percentOf,
  sumMinor,
  toMinor,
} from '../../src';
import { usd } from './fixtures';

describe('money', () => {
  it('rounds rupees to integer paise half away from zero', () => {
    expect(toMinor(1.005)).toBe(101);
    expect(toMinor(-1.005)).toBe(-101);
    expect(toMinor(0.1 + 0.2)).toBe(30);
    expect(fromMinor(12_345)).toBe(123.45);
  });

  it('sums integer paise exactly where floats would drift', () => {
    const tenCents = Array.from({ length: 10 }, () => toMinor(0.1));
    expect(sumMinor(tenCents)).toBe(100);
    expect(percentOf(10_000, 18)).toBe(1_800);
  });

  it('converts INR to a reporting currency at the stored rate', () => {
    expect(inrPerUnit('INR', [])).toBe(1);
    expect(convertFromInr(800_000, 'USD', [usd])).toBe(100);
  });

  it('refuses to convert without a rate', () => {
    expect(() => inrPerUnit('GBP', [usd])).toThrow(MissingRateError);
    try {
      inrPerUnit('GBP', []);
    } catch (error) {
      expect((error as MissingRateError).currency).toBe('GBP');
    }
  });

  it('formats with a symbol, a code or compactly', () => {
    const base = { locale: 'en-US', rates: [usd] };
    expect(formatMoney(800_000, { ...base, currency: 'USD' })).toBe('$100');
    expect(formatMoney(800_000, { ...base, currency: 'USD', display: 'code' })).toMatch(/USD\s100/);
    expect(formatMoney(15_000_000_000, { ...base, currency: 'INR', compact: true })).toBe('₹150M');
  });
});
