import { env } from '../../../config/env';
import { runAsPlatform } from '../../../lib/tenant';
import { logger } from '../../../utils/logger';
import { JOB_KEYS, recordJobRun } from '../../../utils/jobHeartbeat';
import { registerBackgroundJob } from '../jobs.registry';
import { FxRatesModel } from './fx.model';

/** Rates are published once a working day; looking every six hours picks them up the same day. */
const TICK_MS = 6 * 60 * 60 * 1000;

const KEY = 'USD';
const CURRENCY = /^[A-Z]{3}$/;

/** Exchange rates from US dollars, as the dashboards read them. */
export interface FxRates {
  base: 'USD';
  date: string;
  rates: { currency: string; rate: number }[];
}

interface ProviderAnswer {
  date?: unknown;
  rates?: unknown;
}

/** Keeps only well-formed `CODE: positive number` pairs from the provider's answer. */
function cleanRates(rates: unknown): Map<string, number> {
  const clean = new Map<string, number>();
  if (typeof rates !== 'object' || rates === null) {
    return clean;
  }
  for (const [currency, rate] of Object.entries(rates)) {
    if (CURRENCY.test(currency) && typeof rate === 'number' && rate > 0) {
      clean.set(currency, rate);
    }
  }
  return clean;
}

/**
 * Fetches today's rates from the configured source (ECB reference rates by default) and stores
 * them over yesterday's. Answers the day the stored rates are for.
 */
export async function refreshFxRates(): Promise<string> {
  const response = await fetch(env.fx.ratesUrl, { signal: AbortSignal.timeout(env.fx.timeoutMs) });
  if (!response.ok) {
    throw new Error(`Exchange rates request failed (${response.status})`);
  }
  const body = (await response.json()) as ProviderAnswer;
  const rates = cleanRates(body.rates);
  if (typeof body.date !== 'string' || rates.size === 0) {
    throw new Error('The exchange rates answer had no rates');
  }
  rates.set(KEY, 1);
  await runAsPlatform(() =>
    FxRatesModel.updateOne({ key: KEY }, { date: body.date, rates }, { upsert: true }),
  );
  recordJobRun(JOB_KEYS.fxRates, `Rates for ${body.date}: ${rates.size} currencies`);
  return body.date as string;
}

/** The stored rates; just US dollars until the first refresh lands. */
export async function getFxRates(): Promise<FxRates> {
  const row = await runAsPlatform(() => FxRatesModel.findOne({ key: KEY }).lean());
  if (!row) {
    return { base: KEY, date: '', rates: [{ currency: KEY, rate: 1 }] };
  }
  const rates = Object.entries(row.rates as unknown as Record<string, number>)
    .map(([currency, rate]) => ({ currency, rate }))
    .sort((a, b) => a.currency.localeCompare(b.currency));
  return { base: KEY, date: row.date, rates };
}

/** Starts the loop that keeps the rates current: one fetch at boot, then every six hours. */
export function startFxRates(): void {
  const tick = () => {
    refreshFxRates().catch((error: unknown) =>
      logger.warn({ err: error }, 'Could not refresh exchange rates; the last ones stay in use'),
    );
  };
  tick();
  globalThis.setInterval(tick, TICK_MS).unref();
  logger.info('Exchange rates refresh started');
}

registerBackgroundJob({
  key: JOB_KEYS.fxRates,
  label: 'Exchange rates',
  description: 'Fetches the daily US dollar exchange rates the cost dashboards convert with.',
  runOnce: () => refreshFxRates(),
});
