import { IBAN } from '@exyconn/regex';

/**
 * IBAN lengths by country prefix, from the SWIFT IBAN Registry (ISO 13616). A country missing
 * here does not issue IBANs, so its accounts are paid by account number and BIC instead.
 */
export const IBAN_LENGTHS: Readonly<Record<string, number>> = {
  AD: 24, AE: 23, AL: 28, AT: 20, AZ: 28, BA: 20, BE: 16, BG: 22, BH: 22, BI: 27,
  BR: 29, BY: 28, CH: 21, CR: 22, CY: 28, CZ: 24, DE: 22, DJ: 27, DK: 18, DO: 28,
  EE: 20, EG: 29, ES: 24, FI: 18, FK: 18, FO: 18, FR: 27, GB: 22, GE: 22, GI: 23,
  GL: 18, GR: 27, GT: 28, HN: 28, HR: 21, HU: 28, IE: 22, IL: 23, IQ: 23, IS: 26,
  IT: 27, JO: 30, KW: 30, KZ: 20, LB: 28, LC: 32, LI: 21, LT: 20, LU: 20, LV: 21,
  LY: 25, MC: 27, MD: 24, ME: 22, MK: 19, MN: 20, MR: 27, MT: 31, MU: 30, NI: 28,
  NL: 18, NO: 15, OM: 23, PK: 24, PL: 28, PS: 29, PT: 25, QA: 29, RO: 24, RS: 22,
  RU: 33, SA: 24, SC: 31, SD: 18, SE: 24, SI: 19, SK: 24, SM: 27, SO: 23, ST: 25,
  SV: 28, TL: 23, TN: 24, TR: 26, UA: 29, VA: 22, VG: 24, XK: 20, YE: 30,
}; // prettier-ignore

/**
 * Territories whose banks issue IBANs under another country's prefix: the French overseas
 * departments and collectivities under FR, Åland under FI, the Crown Dependencies under GB.
 */
const IBAN_PARENT: Readonly<Record<string, string>> = {
  AX: 'FI', BL: 'FR', GF: 'FR', GP: 'FR', MF: 'FR', MQ: 'FR', NC: 'FR', PF: 'FR',
  PM: 'FR', RE: 'FR', TF: 'FR', WF: 'FR', YT: 'FR', GG: 'GB', IM: 'GB', JE: 'GB',
}; // prettier-ignore

/** The prefix an IBAN from `country` (ISO 3166-1 alpha-2) starts with, or null if it has none. */
export function ibanPrefixFor(country: string): string | null {
  const prefix = IBAN_PARENT[country] ?? country;
  return prefix in IBAN_LENGTHS ? prefix : null;
}

/** Whether accounts in `country` are identified by an IBAN. */
export const usesIban = (country: string): boolean => ibanPrefixFor(country) !== null;

/** A letter is 10–35 (A=10 … Z=35), a digit is itself — the ISO 7064 conversion. */
const ibanDigit = (char: string): string => Number.parseInt(char, 36).toString();

/**
 * The ISO 7064 MOD 97-10 check: the first four characters move to the end, letters become
 * numbers, and the result is 1 modulo 97. Worked in chunks so no number exceeds 2^53.
 */
export function ibanChecksumValid(iban: string): boolean {
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let remainder = 0;
  for (const char of rearranged) {
    for (const digit of ibanDigit(char)) {
      remainder = (remainder * 10 + Number(digit)) % 97;
    }
  }
  return remainder === 1;
}

/** Why an (already normalised) IBAN is wrong for `country`, or null when it is right. */
export function ibanProblem(iban: string, country: string): string | null {
  if (!IBAN.test(iban)) {
    return 'Enter the IBAN: two letters, two check digits, then the account (e.g. DE89 3704 0044 0532 0130 00).';
  }
  const expected = ibanPrefixFor(country);
  if (expected !== null && iban.slice(0, 2) !== expected) {
    return 'This IBAN is not from the chosen country.';
  }
  if (iban.length !== IBAN_LENGTHS[iban.slice(0, 2)]) {
    return 'This IBAN has the wrong number of characters for its country.';
  }
  return ibanChecksumValid(iban)
    ? null
    : 'The IBAN’s check digits do not match. Check it for typos.';
}
