import type { FxRate } from "@exyconn/gcc-cost";
import { z } from "zod";

/**
 * Exchange rates for the calculator, fetched server-side from ExchangeRate-API's free open
 * endpoint (no key, 160+ currencies including AED, SAR and QAR, updated daily) and cached for an
 * hour: one INR table answers every currency. Its terms ask for attribution, which the
 * calculator shows beside the rates (lib/gcc/fx-attribution). The calculator stores rates with the
 * estimate as "INR per unit", so every figure stays reproducible later.
 */
const DEFAULT_URL = "https://open.er-api.com/v6/latest/INR";
const CURRENCY = /^[A-Z]{3}$/;
const MAX_CURRENCIES = 10;
const CACHE_TTL_MS = 60 * 60 * 1000;
const TIMEOUT_MS = 5000;
export const FX_SOURCE = "ExchangeRate-API (open.er-api.com)";

const responseSchema = z.object({
  result: z.literal("success"),
  base_code: z.literal("INR"),
  time_last_update_unix: z.number().int().positive(),
  rates: z.record(z.string(), z.number().positive()),
});
type RateTable = z.infer<typeof responseSchema>;

let cache: { at: number; table: RateTable } | null = null;

/** Test seam: forgets the cached table. */
export function clearFxCache(): void {
  cache = null;
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
const isoDay = (unixSeconds: number) => new Date(unixSeconds * 1000).toISOString().slice(0, 10);

/** The source's answer (units of each currency per 1 INR) as rates in INR per unit. */
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
      asOf: isoDay(parsed.time_last_update_unix),
      userProvided: false,
    };
  });
}

function ratesUrl(): string {
  return import.meta.env.GCC_FX_RATES_URL ?? process.env.GCC_FX_RATES_URL ?? DEFAULT_URL;
}

/** The INR rate table, from the cache when it is under an hour old. */
async function rateTable(now: number): Promise<unknown> {
  if (cache && now - cache.at < CACHE_TTL_MS) {
    return cache.table;
  }
  const response = await fetch(ratesUrl(), { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!response.ok) {
    throw new Error(`Exchange rate source answered HTTP ${response.status}`);
  }
  const table = responseSchema.parse(await response.json());
  cache = { at: now, table };
  return table;
}

/** INR rates for `currencies` (already parsed); throws when the source cannot give them all. */
export async function fetchFxRates(
  currencies: readonly string[],
  now = Date.now()
): Promise<FxRate[]> {
  if (currencies.length === 0) {
    return [];
  }
  return toFxRates(await rateTable(now), currencies);
}

/** Every currency the source has a rate for, INR included, alphabetically. */
export async function fetchCurrencyCodes(now = Date.now()): Promise<string[]> {
  const table = responseSchema.parse(await rateTable(now));
  return Object.keys(table.rates)
    .filter((code) => CURRENCY.test(code))
    .toSorted((a, b) => a.localeCompare(b));
}
