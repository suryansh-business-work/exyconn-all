import { meteredFetch } from '../../tech/usage/usage.meter';
import { badRequest } from '../../../utils/errors';
import type { Raw } from './clutch.types';

const APIFY_API = 'https://api.apify.com/v2';
/** Apify keeps a synchronous run open for up to 300 seconds. */
const RUN_TIMEOUT_SEC = 300;

export interface ApifyClutchInput {
  keyword: string;
  profileUrls: string[];
  includeDetails: boolean;
  includeReviews: boolean;
  includePortfolio: boolean;
  maxItems: number;
}

/**
 * The actor input, in the shape of ScrapeAI's Clutch.co Scraper (`scrapeai/clutch-co-scraper`):
 * a keyword search through every result page ("companies"), or full profiles ("profiles") with
 * reviews and portfolio as opt-in extras. Residential proxies, as Clutch blocks datacenters.
 */
export function actorInput(input: ApifyClutchInput): Raw {
  return {
    ...(input.keyword
      ? { search: input.keyword, mode: input.includeDetails ? 'profiles' : 'companies' }
      : {}),
    ...(input.profileUrls.length ? { startUrls: input.profileUrls.map((url) => ({ url })) } : {}),
    includeReviews: input.includeReviews,
    excludePortfolio: !input.includePortfolio,
    maxItems: input.maxItems,
    proxyConfiguration: { useApifyProxy: true, apifyProxyGroups: ['RESIDENTIAL'] },
  };
}

/** Runs the actor and waits for its dataset. Counted under Environment Variables > Usage. */
export async function runApifyActor(token: string, actorId: string, input: Raw): Promise<Raw[]> {
  const actor = encodeURIComponent(actorId.replace('/', '~'));
  const url = `${APIFY_API}/acts/${actor}/run-sync-get-dataset-items?timeout=${RUN_TIMEOUT_SEC}&format=json`;
  const response = await meteredFetch('APIFY', `run ${actorId}`, url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
    signal: AbortSignal.timeout((RUN_TIMEOUT_SEC + 30) * 1000),
  });
  if (response.status === 401) {
    badRequest('Apify refused the API token. Check it under Lead generators > Clutch > Apify.');
  }
  if (!response.ok) {
    badRequest(`Apify answered HTTP ${response.status} for ${actorId}.`);
  }
  const items = (await response.json()) as unknown;
  return Array.isArray(items) ? (items as Raw[]) : [];
}
