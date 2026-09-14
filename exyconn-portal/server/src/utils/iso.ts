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

export function isValidCurrency(code: string): boolean {
  return CURRENCY_CODE.test(code) && supportedCurrencies().includes(code);
}

/** "India", "Indian Rupee" — for a picker, in the reader's own language. */
export function countryName(code: string, locale = 'en'): string {
  return new Intl.DisplayNames([locale], { type: 'region' }).of(code) ?? code;
}

export function currencyName(code: string, locale = 'en'): string {
  return new Intl.DisplayNames([locale], { type: 'currency' }).of(code) ?? code;
}
