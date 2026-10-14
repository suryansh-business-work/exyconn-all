import type { FxRate } from "@exyconn/gcc-cost";
import { z } from "zod";

/**
 * Reference exchange rates for the calculator, fetched server-side from Frankfurter (European
 * Central Bank reference rates) and cached for an hour per currency set. The calculator stores
 * them with the estimate as "INR per unit", so every figure stays reproducible later.
 */
const DEFAULT_URL = "https://api.frankfurter.app/latest";
const CURRENCY = /^[A-Z]{3}$/;
const MAX_CURRENCIES = 10;
const CACHE_TTL_MS = 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 200;
const TIMEOUT_MS = 5000;
export const FX_SOURCE = "European Central Bank reference rate (Frankfurter)";

const responseSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  rates: z.record(z.string(), z.number().positive()),
});

const cache = new Map<string, { at: number; rates: FxRate[] }>();

/** Test seam: forgets every cached answer. */
export function clearFxCache(): void {
  cache.clear();
}

/**
 * The requested currencies, deduplicated and sorted, or null when the list is empty, too long
 * or holds anything but 3-letter upper-case codes. INR is the base, so it is never requested.
 */
export function parseCurrencies(param: string | null): string[] | null {
  const codes = [...new Set((param ?? "").split(",").map((code) => code.trim()))].filter(Boolean);
  if (
    codes.length === 0 ||
    codes.length > MAX_CURRENCIES ||
    !codes.every((c) => CURRENCY.test(c))
  ) {
    return null;
  }
  return codes.filter((code) => code !== "INR").toSorted((a, b) => a.localeCompare(b));
}

const round6 = (value: number) => Math.round(value * 1_000_000) / 1_000_000;

/** Frankfurter's answer (units of each currency per 1 INR) as rates in INR per unit. */
export function toFxRates(body: unknown, currencies: readonly string[]): FxRate[] {
  const parsed = responseSchema.parse(body);
  return currencies.map((currency) => {
    const perInr = parsed.rates[currency];
    if (perInr === undefined) {
      throw new Error(`No reference rate for ${currency}`);
    }
    return {
      currency,
      inrPerUnit: round6(1 / perInr),
      source: FX_SOURCE,
      asOf: parsed.date,
      userProvided: false,
    };
  });
}

function ratesUrl(currencies: readonly string[]): string {
  const base = import.meta.env.GCC_FX_RATES_URL ?? process.env.GCC_FX_RATES_URL ?? DEFAULT_URL;
  const url = new URL(base);
  url.searchParams.set("from", "INR");
  url.searchParams.set("to", currencies.join(","));
  return url.toString();
}

/** INR rates for `currencies` (already parsed); throws when the source cannot give them all. */
export async function fetchFxRates(
  currencies: readonly string[],
  now = Date.now()
): Promise<FxRate[]> {
  if (currencies.length === 0) {
    return [];
  }
  const key = currencies.join(",");
  const hit = cache.get(key);
  if (hit && now - hit.at < CACHE_TTL_MS) {
    return hit.rates;
  }
  const response = await fetch(ratesUrl(currencies), { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!response.ok) {
    throw new Error(`Exchange rate source answered HTTP ${response.status}`);
  }
  const rates = toFxRates(await response.json(), currencies);
  cache.delete(key);
  cache.set(key, { at: now, rates });
  if (cache.size > MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) {
      cache.delete(oldest);
    }
  }
  return rates;
}
