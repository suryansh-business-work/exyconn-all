import { describe, expect, it } from 'vitest';
import { emptyPayout } from '@exyconn/payout';
import { BankAccountType, PayoutMethod, PayoutSecretField } from '@/graphql/generated';
import {
  payoutAccountSchema,
  storedSecrets,
  toFormValues,
  toPayoutInput,
} from '@/components/payout/forms/payout-account';
import { SECRET_ENUM } from '@/components/payout/forms/payout-account/payout-account.schema';
import { bankAccount, upiAccount } from './payoutFixtures';

const INDIAN_BANK = {
  ...emptyPayout('BANK_TRANSFER', 'IN', 'INR'),
  holderName: 'Ravi Kumar',
  bankName: 'HDFC Bank',
  accountNumber: '50100123456789',
  routingCode: 'HDFC0001234',
  isPrimary: false,
};

describe('storedSecrets', () => {
  it('names the sealed fields a saved account has a hint for', () => {
    expect([...storedSecrets(bankAccount())]).toEqual(['accountNumber']);
    expect([...storedSecrets(upiAccount())]).toEqual(['upiId']);
    expect(storedSecrets(null).size).toBe(0);
  });
});

describe('payoutAccountSchema', () => {
  it('accepts a complete Indian bank account', () => {
    expect(payoutAccountSchema(new Set()).safeParse(INDIAN_BANK).success).toBe(true);
  });

  it('puts each problem on its own field', () => {
    const result = payoutAccountSchema(new Set()).safeParse({
      ...INDIAN_BANK,
      routingCode: 'HDFC1001234',
      accountNumber: '',
    });
    expect(result.success).toBe(false);
    const fields = result.error?.issues.map((issue) => issue.path[0]);
    expect(fields).toEqual(['accountNumber', 'routingCode']);
  });

  it('lets an edit leave a stored account number blank', () => {
    const schema = payoutAccountSchema(new Set(['accountNumber'] as const));
    expect(schema.safeParse({ ...INDIAN_BANK, accountNumber: '' }).success).toBe(true);
  });

  it('asks for the country and currency before checking the details', () => {
    const result = payoutAccountSchema(new Set()).safeParse({ ...INDIAN_BANK, country: '' });
    expect(result.error?.issues.map((issue) => issue.message)).toEqual([
      'Choose the country the account is in',
    ]);
  });
});

describe('toFormValues', () => {
  it('starts a new account in the given method, country and currency', () => {
    expect(toFormValues(null, 'UPI', 'IN', 'INR')).toMatchObject({
      method: 'UPI',
      country: 'IN',
      currency: 'INR',
      holderName: '',
      isPrimary: false,
    });
  });

  it('fills a saved account but leaves every sealed field blank', () => {
    const values = toFormValues(bankAccount(), 'BANK_TRANSFER', 'US', 'USD');
    expect(values).toMatchObject({
      country: 'IN',
      holderName: 'Ravi Kumar',
      routingCode: 'HDFC0001234',
      accountType: 'SAVINGS',
      accountNumber: '',
      isPrimary: true,
    });
    expect(toFormValues(upiAccount(), 'BANK_TRANSFER', 'IN', 'INR').accountType).toBe('');
  });
});

describe('toPayoutInput', () => {
  it('sends only what the method asks for, with the API enums', () => {
    const input = toPayoutInput({
      ...INDIAN_BANK,
      accountType: 'CURRENT',
      upiId: 'stale@okaxis',
      isPrimary: true,
    });
    expect(input).toMatchObject({
      method: PayoutMethod.BankTransfer,
      accountType: BankAccountType.Current,
      routingCode: 'HDFC0001234',
      upiId: '',
      isPrimary: true,
    });
    expect(toPayoutInput(INDIAN_BANK).accountType).toBeNull();
  });
});

describe('SECRET_ENUM', () => {
  it('maps each sealed field to the reveal API name', () => {
    expect(SECRET_ENUM.iban).toBe(PayoutSecretField.Iban);
    expect(SECRET_ENUM.walletEmail).toBe(PayoutSecretField.WalletEmail);
  });
});
