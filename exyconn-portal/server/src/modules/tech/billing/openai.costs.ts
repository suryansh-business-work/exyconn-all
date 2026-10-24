import { env } from '../../../config/env';
import { usageDay } from '../usage/usage.meter';

/** One day of what OpenAI billed. */
export interface BilledDay {
  day: string;
  amountUsd: number;
}

interface CostsPage {
  data?: Array<{
    start_time: number;
    results?: Array<{ amount?: { value?: number; currency?: string } }>;
  }>;
}

const SECONDS = 1000;
const DAY_SECONDS = 24 * 60 * 60;

/**
 * The organisation's real daily costs from OpenAI's Costs API, read with an Admin key, newest
 * `days` days. Every line item of a day is summed; OpenAI reports them in US dollars.
 */
export async function fetchOpenAiCosts(
  adminKey: string,
  days: number,
  now = new Date(),
): Promise<BilledDay[]> {
  const start = Math.floor(now.getTime() / SECONDS) - (days - 1) * DAY_SECONDS;
  const startOfDay = start - (start % DAY_SECONDS);
  const url = `${env.openAiBilling.costsUrl}?start_time=${startOfDay}&bucket_width=1d&limit=${days}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${adminKey}` },
    signal: AbortSignal.timeout(env.openAiBilling.timeoutMs),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OpenAI costs failed (${response.status}): ${detail.slice(0, 200)}`);
  }
  const page = (await response.json()) as CostsPage;
  return (page.data ?? []).map((bucket) => ({
    day: usageDay(new Date(bucket.start_time * SECONDS)),
    amountUsd: (bucket.results ?? []).reduce((sum, item) => sum + (item.amount?.value ?? 0), 0),
  }));
}
