import { describe, expect, it } from 'vitest';
import { balanceOf, money } from '../../../src/pages/money';

describe('money', () => {
  it('writes an amount in its own currency', () => {
    expect(money(1234.5, 'USD')).toBe('$1,234.50');
    expect(money(99, 'EUR')).toBe('€99.00');
  });

  it('writes a refund as a negative amount', () => {
    expect(money(-20, 'USD')).toBe('-$20.00');
  });
});

describe('balanceOf', () => {
  it('subtracts what was paid from the invoice amount', () => {
    expect(balanceOf({ amount: 1000, amountPaid: 250 })).toBe(750);
  });

  it('treats a missing or null payment as nothing paid', () => {
    expect(balanceOf({ amount: 80 })).toBe(80);
    expect(balanceOf({ amount: 80, amountPaid: null })).toBe(80);
  });

  it('rounds to two places so float noise never leaves a cent owing', () => {
    expect(balanceOf({ amount: 0.3, amountPaid: 0.1 })).toBe(0.2);
    expect(balanceOf({ amount: 100.005, amountPaid: 0 })).toBe(100.01);
  });

  it('is zero or negative once the invoice is paid in full or overpaid', () => {
    expect(balanceOf({ amount: 50, amountPaid: 50 })).toBe(0);
    expect(balanceOf({ amount: 50, amountPaid: 60 })).toBe(-10);
  });
});
