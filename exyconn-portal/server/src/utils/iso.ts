/**
 * The international standards a workspace is described in — read from the runtime's own ICU
 * data rather than a table in this repository, so the portal knows every country and currency
 * the platform it runs on does, and nobody has to maintain a list.
 *
 * ISO 3166-1 alpha-2 for a country, ISO 4217 for a currency, BCP 47 for a language (see
 * modules/i18n/locale.constants.ts) and an IANA name for a timezone (see utils/timezone.ts).
 */

const COUNTRY_CODE = /^[A-Z]{2}$/;
const CURRENCY_CODE = /^[A-Z]{3}$/;

/** Every ISO 4217 code this runtime knows, sorted. */
export function supportedCurrencies(): string[] {
  return [...Intl.supportedValuesOf('currency')].sort((a, b) => a.localeCompare(b));
}

/**
 * Whether `code` is an ISO 3166-1 alpha-2 country. ICU answers with the code itself when it
 * does not recognise it, which is how an invented "XX" is told apart from a real one.
 */
export function isValidCountry(code: string): boolean {
  if (!COUNTRY_CODE.test(code)) {
    return false;
  }
  return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) !== code;
}

/** The same table as a set, read once: every money record is validated against it. */
let currencyTable: ReadonlySet<string> | null = null;

export function isValidCurrency(code: string): boolean {
  currencyTable ??= new Set(Intl.supportedValuesOf('currency'));
  return CURRENCY_CODE.test(code) && currencyTable.has(code);
}

/**
 * A stored or typed currency as its ISO 4217 code, or null when it names none.
 *
 * Records written before currencies were validated hold '', 'inr ' or '₹'; anything that
 * renders money asks here first, because Intl throws on every one of those.
 */
export function normalizeCurrency(code: string | null | undefined): string | null {
  const candidate = (code ?? '').trim().toUpperCase();
  return isValidCurrency(candidate) ? candidate : null;
}

/** "India", "Indian Rupee" — for a picker, in the reader's own language. */
export function countryName(code: string, locale = 'en'): string {
  return new Intl.DisplayNames([locale], { type: 'region' }).of(code) ?? code;
}

export function currencyName(code: string, locale = 'en'): string {
  return new Intl.DisplayNames([locale], { type: 'currency' }).of(code) ?? code;
}
