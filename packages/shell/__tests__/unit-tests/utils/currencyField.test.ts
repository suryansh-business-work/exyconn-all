import { describe, expect, it } from 'vitest';
import { currencyField, optionalCurrencyField } from '@/utils/currencyField';

const firstMessage = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
  result.error?.issues[0]?.message;

describe('currencyField', () => {
  it('accepts an ISO 4217 code and stores it trimmed and upper-cased', () => {
    expect(currencyField.parse('INR')).toBe('INR');
    expect(currencyField.parse(' eur ')).toBe('EUR');
  });

  it('asks for a currency when there is none', () => {
    expect(firstMessage(currencyField.safeParse(''))).toBe('Currency is required');
    expect(currencyField.safeParse('   ').error?.issues.map((issue) => issue.message)).toEqual([
      'Currency is required',
    ]);
  });

  it('refuses a code ISO 4217 does not have, a sign, or a code of the wrong length', () => {
    for (const value of ['ABC', '₹', 'RUPEE', 'US']) {
      expect(firstMessage(currencyField.safeParse(value))).toBe('Choose a valid ISO 4217 currency');
    }
  });
});

describe('optionalCurrencyField', () => {
  it('accepts blank, for the company currency, and any ISO 4217 code', () => {
    expect(optionalCurrencyField.parse('')).toBe('');
    expect(optionalCurrencyField.parse('usd')).toBe('USD');
  });

  it('refuses a code ISO 4217 does not have', () => {
    expect(firstMessage(optionalCurrencyField.safeParse('XYZ'))).toBe(
      'Choose a valid ISO 4217 currency',
    );
  });
});
