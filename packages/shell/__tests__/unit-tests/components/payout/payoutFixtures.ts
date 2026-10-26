import {
  BankAccountType,
  PayoutMethod,
  type PayoutAccountFieldsFragment,
} from '@/graphql/generated';

const NO_HINTS = { accountNumber: '', iban: '', upiId: '', phone: '', walletEmail: '' };

/** A saved Indian salary account: IFSC plus a sealed account number ending 6789. */
export function bankAccount(
  patch: Partial<PayoutAccountFieldsFragment> = {},
): PayoutAccountFieldsFragment {
  return {
    __typename: 'PayoutAccount',
    id: 'pa1',
    method: PayoutMethod.BankTransfer,
    country: 'IN',
    currency: 'INR',
    holderName: 'Ravi Kumar',
    bankName: 'HDFC Bank',
    branchName: '',
    bic: '',
    routingCode: 'HDFC0001234',
    accountType: BankAccountType.Savings,
    city: '',
    region: '',
    hints: { __typename: 'PayoutAccountHints', ...NO_HINTS, accountNumber: '•••• 6789' },
    summary: 'HDFC0001234 · •••• 6789',
    isPrimary: true,
    updatedAt: '2026-10-26T10:00:00.000Z',
    ...patch,
  };
}

/** A saved UPI account with only the UPI ID on file. */
export function upiAccount(): PayoutAccountFieldsFragment {
  return bankAccount({
    id: 'pa2',
    method: PayoutMethod.Upi,
    bankName: '',
    routingCode: '',
    accountType: null,
    hints: { __typename: 'PayoutAccountHints', ...NO_HINTS, upiId: 'ra••••@okhdfcbank' },
    summary: 'ra••••@okhdfcbank',
    isPrimary: false,
  });
}
