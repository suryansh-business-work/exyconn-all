import type { FxRate } from './schema';

/*
 * Money is held as integer paise (minor units of INR) once a charge is computed: every money
 * `number` this package returns is paise. Each charge is rounded once, half away from zero, and
 * every total is a sum of integers — so totals are exact and always equal the sum of the line
 * items a report prints.
 */
export const BASE_CURRENCY = 'INR';

/** Rounds a rupee amount to integer paise, half away from zero. */
export function toMinor(rupees: number): number {
  const scaled = Math.abs(rupees) * 100;
  const rounded = Math.round(scaled + Number.EPSILON * scaled);
  return rupees < 0 ? -rounded : rounded;
}

export function fromMinor(minor: number): number {
  return minor / 100;
}

export function sumMinor(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

/** Applies a percentage to integer paise, rounding the result once. */
export function percentOf(minor: number, pct: number): number {
  return toMinor((minor * pct) / 10_000);
}

export class MissingRateError extends Error {
  constructor(readonly currency: string) {
    super(`No exchange rate for ${currency}`);
    this.name = 'MissingRateError';
  }
}

/** Rupees per one unit of `currency`; INR is 1. Throws when the estimate has no rate for it. */
export function inrPerUnit(currency: string, rates: readonly FxRate[]): number {
  if (currency === BASE_CURRENCY) {
    return 1;
  }
  const rate = rates.find((entry) => entry.currency === currency);
  if (!rate) {
    throw new MissingRateError(currency);
  }
  return rate.inrPerUnit;
}

/** Converts INR paise to the reporting currency's major units (unrounded; round to display). */
export function convertFromInr(minor: number, currency: string, rates: readonly FxRate[]): number {
  return fromMinor(minor) / inrPerUnit(currency, rates);
}

export interface FormatOptions {
  currency: string;
  locale: string;
  rates: readonly FxRate[];
  /** `code` prints "INR 1,000" — used in PDFs, whose font may lack a currency's symbol. */
  display?: 'symbol' | 'code';
  compact?: boolean;
}

/** INR paise formatted in the reporting currency for the reader's locale. */
export function formatMoney(minor: number, options: FormatOptions): string {
  const value = convertFromInr(minor, options.currency, options.rates);
  return new Intl.NumberFormat(options.locale, {
    style: 'currency',
    currency: options.currency,
    currencyDisplay: options.display ?? 'symbol',
    notation: options.compact ? 'compact' : 'standard',
    // Set both ends: left to a currency's default minimum, some ICU builds print "₹150.0M".
    minimumFractionDigits: 0,
    maximumFractionDigits: options.compact ? 1 : 0,
  }).format(value);
}
