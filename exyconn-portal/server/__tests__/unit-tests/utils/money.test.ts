import { formatAmount } from '../../../src/utils/money';

describe('formatAmount', () => {
  it('writes money in the company notation with the currency symbol', () => {
    const indian = formatAmount(82500, 'INR', 'en-IN');
    expect(indian).toContain('₹');
    expect(indian).toContain('82,500.00');
  });

  it('uses the reader locale separators', () => {
    const german = formatAmount(82500, 'EUR', 'de-DE');
    expect(german).toContain('82.500,00');
    expect(german).toContain('€');
  });

  it('accepts a sloppy stored code by normalising it first', () => {
    expect(formatAmount(10, ' usd ', 'en-US')).toBe('$10.00');
  });

  it('prints the bare figure to two places when the currency is not ISO 4217', () => {
    expect(formatAmount(82500, '₹', 'en-US')).toBe('82,500.00');
    expect(formatAmount(1.5, '', 'en-US')).toBe('1.50');
  });
});
