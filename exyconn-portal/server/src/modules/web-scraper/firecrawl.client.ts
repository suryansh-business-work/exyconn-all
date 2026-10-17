/**
 * Firecrawl's scrape endpoint (v2): one page, main content only, as markdown. Called from this
 * server with the active config's key, so the key never reaches a browser.
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
  const response = await fetch(scrapeUrlOf(baseUrl), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
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
