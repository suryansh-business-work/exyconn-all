/**
 * The international standards a company is described in, read from the runtime's own ICU
 * tables rather than a list in this repository: ISO 3166-1 alpha-2 countries and ISO 4217
 * currencies, each named in the reader's own language.
 *
 * The server validates the same values against the same tables (`utils/iso.ts`), so a picker
 * here and the check there can never disagree about what a real country or currency is.
 */

import { activeFormatSettings } from './active-settings';

export interface IsoOption {
  /** The standard's own code: "DE", "EUR". */
  code: string;
  /** What to show a person: "Germany", "Euro". */
  label: string;
}

function byLabel(a: IsoOption, b: IsoOption): number {
  return a.label.localeCompare(b.label);
}

/** An ISO 4217 currency, described the way a money picker shows it. */
export interface CurrencyOption extends IsoOption {
  /** Its name in the reader's language: "Indian Rupee". */
  name: string;
  /** The sign it is written with in that language: "₹" — the code itself when it has none. */
  symbol: string;
  /** Digits after the decimal point: 2 for INR, 0 for JPY, 3 for KWD. */
  minorUnits: number;
}

/** The sign and minor units ICU writes `code` with in `locale`. */
function currencyNotation(
  locale: string,
  code: string,
): Pick<CurrencyOption, 'symbol' | 'minorUnits'> {
  const format = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: code,
    currencyDisplay: 'narrowSymbol',
  });
  const symbol = format.formatToParts(0).find((part) => part.type === 'currency')?.value ?? code;
  return { symbol, minorUnits: format.resolvedOptions().maximumFractionDigits ?? 0 };
}

/**
 * Every ISO 4217 currency this runtime knows, named in `locale` and labelled
 * "INR — Indian Rupee (₹)" so a picker can be searched by code or by name. The list, the
 * names, the signs and the minor units all come from the runtime's ICU data
 * (`Intl.supportedValuesOf`, `Intl.DisplayNames`, `Intl.NumberFormat`), never a table here.
 */
export function currencyOptions(locale: string): CurrencyOption[] {
  const names = new Intl.DisplayNames([locale], { type: 'currency' });
  return Intl.supportedValuesOf('currency')
    .map((code) => {
      const name = names.of(code) ?? code;
      const notation = currencyNotation(locale, code);
      const sign = notation.symbol === code ? '' : ` (${notation.symbol})`;
      return { code, name, ...notation, label: `${code} — ${name}${sign}` };
    })
    .sort(byLabel);
}

/** Whether ICU treats `code` as itself, not a retired alias: "DD" (East Germany) is "DE". */
function isCanonicalRegion(code: string): boolean {
  return Intl.getCanonicalLocales(`und-${code}`)[0] === `und-${code}`;
}

/**
 * Every ISO 3166-1 alpha-2 country, named in `locale`. ICU answers with the code itself for
 * anything it does not recognise, which is how the reserved and unassigned ranges drop out.
 * It also names the retired codes that now point at a country ("DD", "UK", "SU"), so those are
 * skipped, or the same country would be offered twice.
 */
export function countryOptions(locale: string): IsoOption[] {
  const names = new Intl.DisplayNames([locale], { type: 'region' });
  const codes: IsoOption[] = [];
  for (let first = 65; first <= 90; first += 1) {
    for (let second = 65; second <= 90; second += 1) {
      const code = String.fromCodePoint(first) + String.fromCodePoint(second);
      const label = names.of(code);
      if (label !== undefined && label !== code && isCanonicalRegion(code)) {
        codes.push({ code, label });
      }
    }
  }
  return codes.sort(byLabel);
}

const COUNTRY_CODE = /^[A-Z]{2}$/;

/**
 * Whether `code` is an ISO 3166-1 alpha-2 country — the same test the server applies, so a
 * form never accepts a code the API would refuse.
 */
export function isValidCountry(code: string): boolean {
  return (
    COUNTRY_CODE.test(code) && new Intl.DisplayNames(['en'], { type: 'region' }).of(code) !== code
  );
}

/**
 * A country code as the reader's language names it: "IN" → "India", "Indien". Defaults to
 * the workspace language so code with no React context — a grid column — can use it.
 */
export function countryName(code: string, locale = activeFormatSettings().locale): string {
  return new Intl.DisplayNames([locale], { type: 'region' }).of(code) ?? code;
}

const CURRENCY_CODE = /^[A-Z]{3}$/;

/** The runtime's ISO 4217 table, read once; null where the engine cannot list it (Hermes). */
let knownCurrencies: ReadonlySet<string> | null | undefined;

function currencyTable(): ReadonlySet<string> | null {
  if (knownCurrencies === undefined) {
    knownCurrencies =
      'supportedValuesOf' in Intl ? new Set(Intl.supportedValuesOf('currency')) : null;
  }
  return knownCurrencies;
}

/** Whether Intl will format money in `code` — the check for engines with no table to read. */
function formatsAsCurrency(code: string): boolean {
  try {
    return (
      new Intl.NumberFormat('en', { style: 'currency', currency: code }).resolvedOptions()
        .currency === code
    );
  } catch {
    return false;
  }
}

/**
 * A stored or typed currency as the ISO 4217 code Intl needs, or null when it names none.
 *
 * Records written before currencies were validated hold '', 'inr ' or '₹'. Handing any of
 * those to `Intl.NumberFormat` throws "RangeError: Invalid currency code" and takes the
 * whole screen down, so every money formatter asks here first.
 */
export function normalizeCurrency(code: string | null | undefined): string | null {
  const candidate = (code ?? '').trim().toUpperCase();
  if (!CURRENCY_CODE.test(candidate)) {
    return null;
  }
  const table = currencyTable();
  const known = table === null ? formatsAsCurrency(candidate) : table.has(candidate);
  return known ? candidate : null;
}
