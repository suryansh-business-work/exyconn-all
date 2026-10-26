import { describe, expect, it } from 'vitest';
import { abaChecksumValid, bankRulesFor } from '../../src';

describe('bank rules by country', () => {
  it('asks India for an IFSC and a 9–18 digit account, account type optional', () => {
    const rules = bankRulesFor('IN');
    expect(rules.routing?.label).toBe('IFSC');
    expect(rules.routing?.pattern.test('HDFC0001234')).toBe(true);
    expect(rules.accountNumber.pattern.test('50100123456789')).toBe(true);
    expect(rules).toMatchObject({ iban: 'none', account: 'required', accountType: 'optional' });
  });

  it('asks the US for an ABA number whose check digit adds up, and the account type', () => {
    expect(abaChecksumValid('021000021')).toBe(true);
    expect(abaChecksumValid('021000022')).toBe(false);
    const rules = bankRulesFor('US');
    expect(rules.routing?.check?.('021000021')).toBe(true);
    expect(rules.accountType).toBe('required');
  });

  it('lets the UK give an IBAN too, and gives IBAN countries no separate account number', () => {
    expect(bankRulesFor('GB')).toMatchObject({ iban: 'optional', account: 'required' });
    expect(bankRulesFor('DE')).toMatchObject({ iban: 'required', account: 'none', routing: null });
  });

  it('pays everywhere else by account number and a required BIC', () => {
    expect(bankRulesFor('SG')).toMatchObject({
      iban: 'none',
      account: 'required',
      bic: 'required',
    });
    expect(bankRulesFor('NZ').routing).toBeNull();
    expect(bankRulesFor('AU').routing?.label).toBe('BSB');
    expect(bankRulesFor('CA').routing?.label).toBe('Institution and transit number');
  });
});
