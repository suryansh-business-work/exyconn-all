import { describe, it, expect } from 'vitest';
import { formatMoney } from '../../src/utils/money';

describe('formatMoney', () => {
  it('formats INR with the rupee symbol and no decimals', () => {
    expect(formatMoney(92000)).toBe('₹92,000');
  });

  it('honors a different currency', () => {
    const usd = formatMoney(1500, 'USD', 'en-US');
    expect(usd).toContain('1,500');
    expect(usd).toContain('$');
  });

  it('formats zero', () => {
    expect(formatMoney(0)).toBe('₹0');
  });
});
