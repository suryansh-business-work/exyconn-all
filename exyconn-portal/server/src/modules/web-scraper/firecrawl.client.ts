/**
 * Firecrawl's scrape endpoint (v2): one page, main content only, as markdown. Called from this
 * server with the active config's key, so the key never reaches a browser. A self-hosted
 * Firecrawl without authentication has no key, and then no Authorization header is sent.
 */

const TIMEOUT_MS = 60_000;

export interface ScrapedPage {
  title: string;
  markdown: string;
}

interface ScrapePayload {
  success?: boolean;
  error?: string;
  data?: { markdown?: string; metadata?: { title?: string } };
}

/** The scrape endpoint of a Firecrawl install, whatever trailing slash the base URL carries. */
export const scrapeUrlOf = (baseUrl: string) => `${baseUrl.replace(/\/+$/, '')}/v2/scrape`;

export async function firecrawlScrape(
  baseUrl: string,
  apiKey: string,
  url: string,
): Promise<ScrapedPage> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }
  const response = await fetch(scrapeUrlOf(baseUrl), {
    method: 'POST',
    headers,
    body: JSON.stringify({ url, formats: ['markdown'], onlyMainContent: true }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const payload = (await response.json().catch(() => ({}))) as ScrapePayload;
  if (!response.ok || payload.success === false) {
    const reason = payload.error ?? `HTTP ${response.status}`;
    throw new Error(`Firecrawl could not read the page: ${reason}`);
  }
  return {
    title: payload.data?.metadata?.title ?? '',
    markdown: payload.data?.markdown ?? '',
  };
}
