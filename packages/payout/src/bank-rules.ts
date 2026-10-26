import {
  ABA_ROUTING,
  AU_ACCOUNT_NUMBER,
  AU_BSB,
  BANK_ACCOUNT_NUMBER,
  CA_ACCOUNT_NUMBER,
  CA_ROUTING,
  GB_ACCOUNT_NUMBER,
  IFSC,
  IN_ACCOUNT_NUMBER,
  NZ_ACCOUNT_NUMBER,
  UK_SORT_CODE,
  US_ACCOUNT_NUMBER,
} from '@exyconn/regex';
import { usesIban } from './iban';

/** Whether a field must be filled, may be, or is not asked for at all. */
export type Need = 'required' | 'optional' | 'none';

/** A country's domestic bank or branch code: what it is called and the shape it has. */
export interface RoutingRule {
  label: string;
  hint: string;
  pattern: RegExp;
  /** A check-digit test beyond the shape, where the scheme has one. */
  check?: (code: string) => boolean;
}

/** How a bank account in one country is identified for a transfer. */
export interface BankRules {
  iban: Need;
  /** The domestic account number; 'none' where the IBAN already carries it. */
  account: Need;
  /** The domestic account number's shape, and the hint a form shows for it. */
  accountNumber: { pattern: RegExp; hint: string };
  routing: RoutingRule | null;
  /** The BIC is what an international (SWIFT) transfer is routed by. */
  bic: Need;
  /** Checking or savings: US transfers (ACH) are refused without it. */
  accountType: Need;
}

/**
 * The ABA check digit: the nine digits weighted 3, 7, 1 repeating must sum to a multiple of 10.
 * Catches every single-digit typo and most transpositions.
 */
export function abaChecksumValid(routing: string): boolean {
  const weights = [3, 7, 1];
  let sum = 0;
  for (let i = 0; i < routing.length; i += 1) {
    sum += Number(routing[i]) * (weights[i % 3] ?? 0);
  }
  return sum % 10 === 0;
}

/** Shared by every domestic scheme below: no IBAN, a local code and number, BIC for abroad. */
const LOCAL = { iban: 'none', account: 'required', bic: 'optional', accountType: 'none' } as const;

const COUNTRY_RULES: Readonly<Record<string, BankRules>> = {
  IN: {
    ...LOCAL,
    accountNumber: {
      pattern: IN_ACCOUNT_NUMBER,
      hint: '9 to 18 digits, as printed on the cheque book or passbook.',
    },
    routing: {
      label: 'IFSC',
      hint: 'The branch’s 11-character IFSC, e.g. HDFC0001234 (fifth character is always 0).',
      pattern: IFSC,
    },
    accountType: 'optional',
  },
  US: {
    ...LOCAL,
    accountNumber: { pattern: US_ACCOUNT_NUMBER, hint: '4 to 17 digits.' },
    routing: {
      label: 'ABA routing number',
      hint: 'The nine-digit routing transit number at the bottom left of a cheque.',
      pattern: ABA_ROUTING,
      check: abaChecksumValid,
    },
    accountType: 'required',
  },
  GB: {
    ...LOCAL,
    iban: 'optional',
    accountNumber: { pattern: GB_ACCOUNT_NUMBER, hint: 'Eight digits.' },
    routing: { label: 'Sort code', hint: 'Six digits, e.g. 12-34-56.', pattern: UK_SORT_CODE },
  },
  CA: {
    ...LOCAL,
    accountNumber: { pattern: CA_ACCOUNT_NUMBER, hint: '7 to 12 digits.' },
    routing: {
      label: 'Institution and transit number',
      hint: 'The three-digit institution number followed by the five-digit transit number.',
      pattern: CA_ROUTING,
    },
  },
  AU: {
    ...LOCAL,
    accountNumber: { pattern: AU_ACCOUNT_NUMBER, hint: '5 to 9 digits.' },
    routing: { label: 'BSB', hint: 'Six digits, e.g. 062-000.', pattern: AU_BSB },
  },
  NZ: {
    ...LOCAL,
    accountNumber: {
      pattern: NZ_ACCOUNT_NUMBER,
      hint: 'Bank, branch, account and suffix together: 15 or 16 digits.',
    },
    routing: null,
  },
};

/** IBAN countries: the IBAN is the account, the BIC is only needed outside SEPA routing. */
const IBAN_RULES: BankRules = {
  iban: 'required',
  account: 'none',
  accountNumber: { pattern: BANK_ACCOUNT_NUMBER, hint: '' },
  routing: null,
  bic: 'optional',
  accountType: 'none',
};

/** Everywhere else: an international (SWIFT) transfer to an account number at a BIC. */
const SWIFT_RULES: BankRules = {
  iban: 'none',
  account: 'required',
  accountNumber: {
    pattern: BANK_ACCOUNT_NUMBER,
    hint: 'The account number as the bank writes it: 4 to 34 letters or digits.',
  },
  routing: null,
  bic: 'required',
  accountType: 'none',
};

/** How to identify a bank account in `country` (ISO 3166-1 alpha-2). */
export function bankRulesFor(country: string): BankRules {
  const own = COUNTRY_RULES[country];
  if (own) {
    return own;
  }
  return usesIban(country) ? IBAN_RULES : SWIFT_RULES;
}
