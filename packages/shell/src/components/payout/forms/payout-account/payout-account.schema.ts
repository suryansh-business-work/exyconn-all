import { z } from 'zod';
import {
  BANK_ACCOUNT_TYPES,
  PAYOUT_METHODS,
  SECRET_FIELDS,
  emptyPayout,
  onlyAskedFields,
  payoutIssues,
  type PayoutMethod,
  type SecretField,
} from '@exyconn/payout';
import {
  BankAccountType,
  PayoutMethod as PayoutMethodEnum,
  PayoutSecretField,
  type PayoutAccountInput,
} from '@/graphql/generated';
import type { PayoutAccountFormValues, PayoutAccountRow } from './payout-account.types';

/** The API's name for each sealed field, for the eye button's reveal. */
export const SECRET_ENUM: Readonly<Record<SecretField, PayoutSecretField>> = {
  accountNumber: PayoutSecretField.AccountNumber,
  iban: PayoutSecretField.Iban,
  upiId: PayoutSecretField.UpiId,
  phone: PayoutSecretField.Phone,
  walletEmail: PayoutSecretField.WalletEmail,
};

const ACCOUNT_TYPE_ENUM: Readonly<Record<string, BankAccountType>> = {
  CURRENT: BankAccountType.Current,
  SAVINGS: BankAccountType.Savings,
};

/** The sealed fields the server already holds for `row`: each has a masked hint. */
export function storedSecrets(row: PayoutAccountRow | null): ReadonlySet<SecretField> {
  return new Set(SECRET_FIELDS.filter((field) => row?.hints[field]));
}

/**
 * Shapes here; the real rules are @exyconn/payout's, the same the server runs. `stored` lets an
 * edit leave a sealed field blank to keep it.
 */
export function payoutAccountSchema(stored: ReadonlySet<SecretField>) {
  return z
    .object({
      method: z.enum(PAYOUT_METHODS),
      country: z.string().min(1, 'Choose the country the account is in'),
      currency: z.string().min(1, 'Choose the currency'),
      holderName: z.string(),
      bankName: z.string(),
      branchName: z.string(),
      accountNumber: z.string(),
      iban: z.string(),
      bic: z.string(),
      routingCode: z.string(),
      accountType: z.enum(['', ...BANK_ACCOUNT_TYPES]),
      upiId: z.string(),
      phone: z.string(),
      walletEmail: z.string(),
      city: z.string(),
      region: z.string(),
      isPrimary: z.boolean(),
    })
    .superRefine((values, ctx) => {
      if (!values.country || !values.currency) {
        return;
      }
      for (const issue of payoutIssues(values, stored)) {
        ctx.addIssue({ code: 'custom', path: [issue.field], message: issue.message });
      }
    });
}

/** A new account (in the given country and currency), or the stored one with secrets blank. */
export function toFormValues(
  row: PayoutAccountRow | null,
  method: PayoutMethod,
  country: string,
  currency: string,
): PayoutAccountFormValues {
  if (!row) {
    return { ...emptyPayout(method, country, currency), isPrimary: false };
  }
  return {
    ...emptyPayout(row.method, row.country, row.currency),
    holderName: row.holderName,
    bankName: row.bankName,
    branchName: row.branchName,
    bic: row.bic,
    routingCode: row.routingCode,
    accountType: row.accountType ?? '',
    city: row.city,
    region: row.region,
    isPrimary: row.isPrimary,
  };
}

/** The API input: only the fields the method asks for, so nothing stale is sent. */
export function toPayoutInput({
  isPrimary,
  ...values
}: PayoutAccountFormValues): PayoutAccountInput {
  const details = onlyAskedFields(values);
  return {
    ...details,
    method: details.method as PayoutMethodEnum,
    accountType: ACCOUNT_TYPE_ENUM[details.accountType] ?? null,
    isPrimary,
  };
}
