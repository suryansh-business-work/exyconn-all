import { bankRulesFor, type Need } from './bank-rules';

/** How money reaches the payee. Mirrors the GraphQL enum `PayoutMethod`. */
export const PAYOUT_METHODS = [
  'BANK_TRANSFER',
  'UPI',
  'PAYPAL',
  'WISE',
  'PAYONEER',
  'WESTERN_UNION',
] as const;
export type PayoutMethod = (typeof PAYOUT_METHODS)[number];

/** Salary is paid to a bank or by UPI; a refund may go back by any method. */
/** The methods one kind of account may use, never empty: the first is a new account's default. */
export type PayoutMethodList = readonly [PayoutMethod, ...PayoutMethod[]];

export const SALARY_METHODS: PayoutMethodList = ['BANK_TRANSFER', 'UPI'];
export const REFUND_METHODS: PayoutMethodList = PAYOUT_METHODS;

export const PAYOUT_METHOD_LABELS: Readonly<Record<PayoutMethod, { label: string }>> = {
  BANK_TRANSFER: { label: 'Bank transfer' },
  UPI: { label: 'UPI' },
  PAYPAL: { label: 'PayPal' },
  WISE: { label: 'Wise' },
  PAYONEER: { label: 'Payoneer' },
  WESTERN_UNION: { label: 'Western Union' },
};

/** The account's kind, as ISO 20022 names it: CACC (current / checking) or SVGS (savings). */
export const BANK_ACCOUNT_TYPES = ['CURRENT', 'SAVINGS'] as const;
export type BankAccountType = (typeof BANK_ACCOUNT_TYPES)[number];

/** UPI is India's: the payee is in India and paid in rupees. */
export const UPI_COUNTRY = 'IN';
export const UPI_CURRENCY = 'INR';

/** Every detail a payout account can carry, as the form and the API name them. */
export interface PayoutDetails {
  method: PayoutMethod;
  /** ISO 3166-1 alpha-2: where the account is held, or where cash is collected. */
  country: string;
  /** ISO 4217: what the payee is paid in. */
  currency: string;
  /** The payee as the bank or wallet holds them; as on government ID for Western Union. */
  holderName: string;
  bankName: string;
  branchName: string;
  accountNumber: string;
  iban: string;
  bic: string;
  /** The country's domestic bank or branch code: IFSC, ABA, sort code, BSB, transit. */
  routingCode: string;
  /** '' where the country does not ask. */
  accountType: BankAccountType | '';
  upiId: string;
  /** E.164. The UPI-linked mobile, or the Western Union receiver's phone. */
  phone: string;
  /** The PayPal, Wise or Payoneer account's email. */
  walletEmail: string;
  city: string;
  /** State or province: Western Union pays to a state in the US, Canada and Mexico. */
  region: string;
}

export type PayoutField = Exclude<keyof PayoutDetails, 'method' | 'country' | 'currency'>;

/** Sealed at rest and never sent to a page unless someone asks to see it (and is logged). */
export const SECRET_FIELDS = ['accountNumber', 'iban', 'upiId', 'phone', 'walletEmail'] as const;
export type SecretField = (typeof SECRET_FIELDS)[number];
const SECRET_SET: ReadonlySet<string> = new Set(SECRET_FIELDS);
export const isSecretField = (field: string): field is SecretField => SECRET_SET.has(field);

/** One field a method asks for, and whether it must be filled. */
export interface FieldSpec {
  field: PayoutField;
  need: Exclude<Need, 'none'>;
  label: string;
  hint: string;
}

const spec = (need: Need, copy: Omit<FieldSpec, 'need'>): FieldSpec[] =>
  need === 'none' ? [] : [{ ...copy, need }];

type WalletMethod = 'PAYPAL' | 'WISE' | 'PAYONEER';

const WALLET_HINTS: Readonly<Record<WalletMethod, { hint: string }>> = {
  PAYPAL: { hint: 'The email the PayPal account is registered to.' },
  WISE: { hint: 'The email the Wise account is registered to.' },
  PAYONEER: { hint: 'The email the Payoneer account is registered to.' },
};

/** States are needed where Western Union pays out by state. */
const WU_STATE_COUNTRIES: ReadonlySet<string> = new Set(['US', 'CA', 'MX']);

function bankFields(country: string): FieldSpec[] {
  const rules = bankRulesFor(country);
  return [
    ...spec('required', {
      field: 'holderName',
      label: 'Account holder name',
      hint: 'Exactly as the bank holds it.',
    }),
    ...spec('required', {
      field: 'bankName',
      label: 'Bank name',
      hint: 'The bank the account is held at.',
    }),
    ...spec('optional', {
      field: 'branchName',
      label: 'Branch',
      hint: 'Optional. The branch or its address.',
    }),
    ...spec(rules.account, {
      field: 'accountNumber',
      label: 'Account number',
      hint: rules.accountNumber.hint,
    }),
    ...spec(rules.routing ? 'required' : 'none', {
      field: 'routingCode',
      label: rules.routing?.label ?? '',
      hint: rules.routing?.hint ?? '',
    }),
    ...spec(rules.iban, {
      field: 'iban',
      label: 'IBAN',
      hint: 'ISO 13616: country, check digits and account, up to 34 characters.',
    }),
    ...spec(rules.bic, {
      field: 'bic',
      label: 'BIC / SWIFT code',
      hint: 'ISO 9362: 8 or 11 characters, e.g. HDFCINBB. Needed for transfers from abroad.',
    }),
    ...spec(rules.accountType, {
      field: 'accountType',
      label: 'Account type',
      hint: 'Current (checking) or savings.',
    }),
  ];
}

/** The fields to ask for, in order, for `method` in `country`. */
export function fieldsFor(method: PayoutMethod, country: string): FieldSpec[] {
  switch (method) {
    case 'BANK_TRANSFER':
      return bankFields(country);
    case 'UPI':
      return [
        ...spec('required', {
          field: 'holderName',
          label: 'Name on the UPI account',
          hint: 'As the bank app shows it.',
        }),
        ...spec('optional', {
          field: 'upiId',
          label: 'UPI ID',
          hint: 'The virtual payment address, e.g. name@okhdfcbank.',
        }),
        ...spec('optional', {
          field: 'phone',
          label: 'UPI-linked mobile',
          hint: 'The +91 mobile number the UPI account is linked to.',
        }),
      ];
    case 'WESTERN_UNION':
      return [
        ...spec('required', {
          field: 'holderName',
          label: 'Receiver’s full name',
          hint: 'Exactly as on their government ID: they show it to collect.',
        }),
        ...spec('required', {
          field: 'city',
          label: 'City',
          hint: 'Where the money will be collected.',
        }),
        ...spec(WU_STATE_COUNTRIES.has(country) ? 'required' : 'optional', {
          field: 'region',
          label: 'State / province',
          hint: 'Required in the US, Canada and Mexico.',
        }),
        ...spec('optional', {
          field: 'phone',
          label: 'Receiver’s phone',
          hint: 'In international format, e.g. +14155550123.',
        }),
      ];
    case 'PAYPAL':
    case 'WISE':
    case 'PAYONEER':
      return [
        ...spec('required', {
          field: 'holderName',
          label: 'Account holder name',
          hint: 'The name on the account.',
        }),
        ...spec('required', {
          field: 'walletEmail',
          label: 'Account email',
          hint: WALLET_HINTS[method].hint,
        }),
      ];
  }
}

/** A blank account for `method`, in the given country and currency. */
export const emptyPayout = (
  method: PayoutMethod,
  country: string,
  currency: string,
): PayoutDetails => ({
  method,
  country,
  currency,
  holderName: '',
  bankName: '',
  branchName: '',
  accountNumber: '',
  iban: '',
  bic: '',
  routingCode: '',
  accountType: '',
  upiId: '',
  phone: '',
  walletEmail: '',
  city: '',
  region: '',
});
