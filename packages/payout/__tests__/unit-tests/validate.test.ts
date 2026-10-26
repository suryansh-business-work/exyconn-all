import { describe, expect, it } from 'vitest';
import {
  emptyPayout,
  fieldsFor,
  maskAddress,
  maskTail,
  normalizePayout,
  onlyAskedFields,
  payoutIssues,
  payoutSummary,
  secretHint,
  type PayoutDetails,
} from '../../src';

const details = (patch: Partial<PayoutDetails>): PayoutDetails => ({
  ...emptyPayout('BANK_TRANSFER', 'IN', 'INR'),
  holderName: 'Ravi Kumar',
  bankName: 'HDFC Bank',
  accountNumber: '50100123456789',
  routingCode: 'HDFC0001234',
  ...patch,
});
const fields = (patch: Partial<PayoutDetails>, stored?: Set<'accountNumber' | 'upiId' | 'phone'>) =>
  payoutIssues(details(patch), stored).map((issue) => issue.field);

describe('payoutIssues', () => {
  it('accepts complete accounts in India, Germany, the US and Singapore', () => {
    expect(fields({})).toEqual([]);
    expect(
      fields({
        country: 'DE',
        currency: 'EUR',
        accountNumber: '',
        routingCode: '',
        iban: 'DE89 3704 0044 0532 0130 00',
        bic: 'COBADEFFXXX',
      }),
    ).toEqual([]);
    expect(
      fields({
        country: 'US',
        currency: 'USD',
        routingCode: '021000021',
        accountType: 'CHECKING' as never,
      }),
    ).toEqual(['accountType']);
    expect(
      fields({
        country: 'US',
        currency: 'USD',
        routingCode: '021000021',
        accountNumber: '123456789',
        accountType: 'CURRENT',
      }),
    ).toEqual([]);
    expect(
      fields({
        country: 'SG',
        currency: 'SGD',
        routingCode: '',
        bic: 'DBSSSGSGXXX',
        accountNumber: '0123456789',
      }),
    ).toEqual([]);
  });

  it('puts each problem on its own field', () => {
    expect(fields({ holderName: 'R', accountNumber: '123', routingCode: 'HDFC1001234' })).toEqual([
      'holderName',
      'accountNumber',
      'routingCode',
    ]);
    expect(
      fields({ country: 'DE', currency: 'EUR', iban: 'DE89370400440532013000', bic: 'HDFCINBB' }),
    ).toEqual(['bic']);
    expect(fields({ country: 'DE', currency: 'EUR', bic: 'NOT A BIC' })).toEqual(['iban', 'bic']);
    expect(fields({ bankName: 'x'.repeat(141) })).toEqual(['bankName']);
  });

  it('asks UPI for India, rupees, and a UPI ID or an Indian linked mobile', () => {
    const upi = { method: 'UPI' as const, bankName: '', accountNumber: '', routingCode: '' };
    expect(fields({ ...upi, upiId: 'ravi@okhdfcbank' })).toEqual([]);
    expect(fields({ ...upi, phone: '+91 98765 43210' })).toEqual([]);
    expect(fields(upi)).toEqual(['upiId']);
    expect(fields(upi, new Set(['phone']))).toEqual([]);
    expect(
      fields({ ...upi, country: 'US', currency: 'USD', upiId: 'bad', phone: '+14155550123' }),
    ).toEqual(['country', 'currency', 'upiId', 'phone']);
    expect(fields({ ...upi, phone: '98765' })).toEqual(['phone']);
  });

  it('asks Western Union for a city, and a state where it pays by state', () => {
    const wu = { method: 'WESTERN_UNION' as const, country: 'US', currency: 'USD', city: 'Austin' };
    expect(fields(wu)).toEqual(['region']);
    expect(fields({ ...wu, region: 'TX' })).toEqual([]);
    expect(fields({ ...wu, country: 'PH', currency: 'PHP' })).toEqual([]);
    expect(fields({ ...wu, city: 'x'.repeat(36), region: 'TX' })).toEqual(['city']);
  });

  it('asks a wallet for a valid account email', () => {
    expect(fields({ method: 'WISE', walletEmail: 'ap@acme.com' })).toEqual([]);
    expect(fields({ method: 'PAYONEER', walletEmail: 'nope' })).toEqual(['walletEmail']);
    expect(fields({ method: 'PAYPAL' })).toEqual(['walletEmail']);
  });

  it('lets an edit leave a stored secret blank', () => {
    expect(fields({ accountNumber: '' })).toEqual(['accountNumber']);
    expect(fields({ accountNumber: '' }, new Set(['accountNumber']))).toEqual([]);
  });
});

describe('fieldsFor', () => {
  it('lists a method’s fields in order, with what each needs', () => {
    expect(fieldsFor('BANK_TRANSFER', 'IN').map((f) => `${f.field}:${f.need}`)).toEqual([
      'holderName:required',
      'bankName:required',
      'branchName:optional',
      'accountNumber:required',
      'routingCode:required',
      'bic:optional',
      'accountType:optional',
    ]);
    expect(fieldsFor('PAYPAL', 'US').map((f) => f.field)).toEqual(['holderName', 'walletEmail']);
    expect(fieldsFor('PAYPAL', 'US')[1].hint).toBe(
      'The email the PayPal account is registered to.',
    );
  });
});

describe('normalising, trimming and masking', () => {
  it('stores identifiers compact and in capitals, addresses in lower case', () => {
    const clean = normalizePayout(
      details({
        routingCode: 'hdfc 0001-234',
        upiId: ' Ravi@OKHDFC ',
        walletEmail: 'A@B.CO',
        phone: '+91 (98765) 43210',
      }),
    );
    expect(clean).toMatchObject({
      routingCode: 'HDFC0001234',
      upiId: 'ravi@okhdfc',
      walletEmail: 'a@b.co',
      phone: '+919876543210',
    });
  });

  it('empties every detail the method does not ask for', () => {
    const kept = onlyAskedFields(details({ method: 'PAYPAL', walletEmail: 'a@b.co' }));
    expect(kept).toMatchObject({
      walletEmail: 'a@b.co',
      accountNumber: '',
      routingCode: '',
      bankName: '',
    });
    expect(kept.country).toBe('IN');
  });

  it('summarises an account without giving it away', () => {
    expect(payoutSummary(details({}))).toBe('HDFC0001234 · •••• 6789');
    expect(
      payoutSummary(details({ routingCode: '', bic: '', iban: 'DE89370400440532013000' })),
    ).toBe('HDFC Bank · •••• 3000');
    expect(payoutSummary(details({ method: 'UPI', upiId: 'ravi@okhdfc' }))).toBe('ra••••@okhdfc');
    expect(payoutSummary(details({ method: 'UPI', phone: '+919876543210' }))).toBe('•••• 3210');
    expect(
      payoutSummary(
        details({ method: 'WESTERN_UNION', city: 'Austin', region: 'TX', country: 'US' }),
      ),
    ).toBe('Austin, TX, US');
    expect(payoutSummary(details({ method: 'WISE', walletEmail: 'ap@acme.com' }))).toBe(
      'ap••••@acme.com',
    );
  });

  it('hints at a sealed value by its tail or its domain', () => {
    expect(secretHint('iban', 'DE89370400440532013000')).toBe('•••• 3000');
    expect(secretHint('walletEmail', 'j@x.com')).toBe('j••••@x.com');
    expect(secretHint('accountNumber', '')).toBe('');
    expect(maskAddress('no-at-sign-1234')).toBe('•••• 1234');
    expect(maskTail('')).toBe('');
  });
});
