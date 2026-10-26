import { BIC, E164_PHONE, EMAIL, INDIAN_MOBILE, UPI_ID } from '@exyconn/regex';
import { bankRulesFor } from './bank-rules';
import { ibanPrefixFor, ibanProblem } from './iban';
import {
  BANK_ACCOUNT_TYPES,
  UPI_COUNTRY,
  UPI_CURRENCY,
  fieldsFor,
  isSecretField,
  type PayoutDetails,
  type PayoutField,
  type SecretField,
} from './methods';

/** One thing wrong with the details, against the field it belongs to. */
export interface PayoutIssue {
  field: PayoutField | 'country' | 'currency';
  message: string;
}

/** Longest a name or place may be: ISO 20022's Max140Text for names, Max35Text for places. */
export const PAYOUT_LIMITS = { name: 140, place: 35 } as const;

const ACCOUNT_TYPE_SET: ReadonlySet<string> = new Set(BANK_ACCOUNT_TYPES);

const compact = (value: string) => value.replaceAll(/[\s-]/g, '').toUpperCase();

/**
 * The details as they are checked and stored: identifiers without spaces or dashes and in
 * capitals (`DE89 3704…` → `DE893704…`, `12-34-56` → `123456`), addresses lower-cased, the
 * rest trimmed.
 */
export function normalizePayout(details: PayoutDetails): PayoutDetails {
  return {
    ...details,
    country: details.country.trim().toUpperCase(),
    currency: details.currency.trim().toUpperCase(),
    holderName: details.holderName.trim(),
    bankName: details.bankName.trim(),
    branchName: details.branchName.trim(),
    accountNumber: compact(details.accountNumber),
    iban: compact(details.iban),
    bic: compact(details.bic),
    routingCode: compact(details.routingCode),
    upiId: details.upiId.trim().toLowerCase(),
    phone: details.phone.replaceAll(/[\s()-]/g, ''),
    walletEmail: details.walletEmail.trim().toLowerCase(),
    city: details.city.trim(),
    region: details.region.trim(),
  };
}

/** Only the fields `method` asks for in `country`; every other one is emptied, never kept stale. */
export function onlyAskedFields(details: PayoutDetails): PayoutDetails {
  const asked = new Set<string>(fieldsFor(details.method, details.country).map((f) => f.field));
  const out: PayoutDetails = { ...details };
  for (const key of Object.keys(out) as (keyof PayoutDetails)[]) {
    if (key !== 'method' && key !== 'country' && key !== 'currency' && !asked.has(key)) {
      (out as unknown as Record<string, string>)[key] = '';
    }
  }
  return out;
}

const REQUIRED: Readonly<Record<PayoutField, { message: string }>> = {
  holderName: { message: 'Enter the name on the account' },
  bankName: { message: 'Enter the bank name' },
  branchName: { message: 'Enter the branch' },
  accountNumber: { message: 'Enter the account number' },
  iban: { message: 'Enter the IBAN' },
  bic: { message: 'Enter the BIC / SWIFT code' },
  routingCode: { message: 'Enter the bank or branch code' },
  accountType: { message: 'Choose the account type' },
  upiId: { message: 'Enter the UPI ID' },
  phone: { message: 'Enter the phone number' },
  walletEmail: { message: 'Enter the account email' },
  city: { message: 'Enter the city' },
  region: { message: 'Enter the state or province' },
};

function bicProblem(bic: string, country: string): string | null {
  if (!BIC.test(bic)) {
    return 'Enter a BIC / SWIFT code of 8 or 11 letters and digits, e.g. HDFCINBB.';
  }
  const issuer = bic.slice(4, 6);
  return issuer === country || issuer === ibanPrefixFor(country)
    ? null
    : 'This BIC belongs to a bank in another country.';
}

function phoneProblem(phone: string, method: PayoutDetails['method']): string | null {
  if (!E164_PHONE.test(phone)) {
    return 'Enter the number in international format: +, country code and number.';
  }
  if (method === 'UPI' && !(phone.startsWith('+91') && INDIAN_MOBILE.test(phone.slice(3)))) {
    return 'Enter the Indian mobile the UPI account is linked to, e.g. +919876543210.';
  }
  return null;
}

function lengthProblem(field: PayoutField, value: string): string | null {
  if (field === 'holderName' && value.length < 2) {
    return 'Enter the full name.';
  }
  if (field === 'city' || field === 'region') {
    return value.length > PAYOUT_LIMITS.place ? 'Keep this under 35 characters.' : null;
  }
  return value.length > PAYOUT_LIMITS.name ? 'Keep this under 140 characters.' : null;
}

/** What is wrong with one filled field, or null. */
function fieldProblem(field: PayoutField, details: PayoutDetails): string | null {
  const value = details[field];
  const rules = bankRulesFor(details.country);
  switch (field) {
    case 'accountNumber':
      return rules.accountNumber.pattern.test(value)
        ? null
        : 'This account number has the wrong format for the chosen country.';
    case 'routingCode': {
      const routing = rules.routing;
      const valid = routing?.pattern.test(value) && (routing.check?.(value) ?? true);
      return valid ? null : 'This bank or branch code is not valid. Check it for typos.';
    }
    case 'iban':
      return ibanProblem(value, details.country);
    case 'bic':
      return bicProblem(value, details.country);
    case 'accountType':
      return ACCOUNT_TYPE_SET.has(value) ? null : REQUIRED.accountType.message;
    case 'upiId':
      return UPI_ID.test(value) ? null : 'Enter a UPI ID like name@okhdfcbank.';
    case 'phone':
      return phoneProblem(value, details.method);
    case 'walletEmail':
      return EMAIL.test(value) ? null : 'Enter a valid email.';
    default:
      return lengthProblem(field, value);
  }
}

/**
 * Everything wrong with a payout account, field by field. `stored` names the sealed fields the
 * server already holds, so an edit that leaves one blank keeps it rather than failing as empty.
 * The portal form and the server both run this, so they refuse exactly the same things.
 */
export function payoutIssues(
  raw: PayoutDetails,
  stored: ReadonlySet<SecretField> = new Set(),
): PayoutIssue[] {
  const details = normalizePayout(raw);
  const issues: PayoutIssue[] = [];
  const present = (field: PayoutField) =>
    details[field] !== '' || (isSecretField(field) && stored.has(field));

  if (details.method === 'UPI') {
    if (details.country !== UPI_COUNTRY) {
      issues.push({ field: 'country', message: 'UPI pays accounts in India only.' });
    }
    if (details.currency !== UPI_CURRENCY) {
      issues.push({ field: 'currency', message: 'UPI pays in Indian rupees (INR) only.' });
    }
    if (!present('upiId') && !present('phone')) {
      issues.push({ field: 'upiId', message: 'Enter the UPI ID or the UPI-linked mobile.' });
    }
  }

  for (const { field, need } of fieldsFor(details.method, details.country)) {
    if (details[field] !== '') {
      const message = fieldProblem(field, details);
      if (message) {
        issues.push({ field, message });
      }
    } else if (need === 'required' && !present(field)) {
      issues.push({ field, message: REQUIRED[field].message });
    }
  }
  return issues;
}
