import type { PayoutAccountInput } from '../../../../src/modules/payout/payout.service';

/** An Indian salary account by IFSC and account number. */
export const indianBank = (patch: Partial<PayoutAccountInput> = {}): PayoutAccountInput => ({
  method: 'BANK_TRANSFER',
  country: 'IN',
  currency: 'INR',
  holderName: 'Ravi Kumar',
  bankName: 'HDFC Bank',
  branchName: '',
  accountNumber: '50100123456789',
  iban: '',
  bic: '',
  routingCode: 'HDFC0001234',
  accountType: 'SAVINGS',
  upiId: '',
  phone: '',
  walletEmail: '',
  city: '',
  region: '',
  ...patch,
});

/** A UPI account with an ID and a linked mobile. */
export const upi = (patch: Partial<PayoutAccountInput> = {}): PayoutAccountInput =>
  indianBank({
    method: 'UPI',
    bankName: '',
    accountNumber: '',
    routingCode: '',
    accountType: null,
    upiId: 'ravi@okhdfcbank',
    phone: '+91 98765 43210',
    ...patch,
  });
