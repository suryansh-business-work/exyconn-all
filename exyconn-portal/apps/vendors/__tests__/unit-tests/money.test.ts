import { describe, expect, it } from 'vitest';
import { money } from '../../src/money';

describe('money', () => {
  it('writes an amount in its own currency', () => {
    expect(money(1234.5, 'USD')).toBe('$1,234.50');
    expect(money(99, 'EUR')).toBe('€99.00');
  });

  it('writes zero with its currency, not as a blank', () => {
    expect(money(0, 'USD')).toBe('$0.00');
  });
});
