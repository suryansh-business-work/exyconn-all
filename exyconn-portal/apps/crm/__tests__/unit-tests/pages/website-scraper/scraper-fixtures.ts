import type {
  WebScrapeAiEstimateQuery,
  WebScrapeFieldsFragment,
} from '@exyconn/shell/graphql/generated';

/** One scraped page with its text and no AI answer yet. */
export function scrapeRow(
  overrides: Partial<WebScrapeFieldsFragment> = {},
): WebScrapeFieldsFragment {
  return {
    id: 'scrape-1',
    url: 'https://acme.com/about',
    title: 'About Acme',
    markdown: '# Acme\nWe make anvils.',
    charCount: 22,
    createdByName: 'Priya',
    createdAt: '2026-10-01T10:00:00.000Z',
    analyzedAt: null,
    aiInstruction: '',
    aiResponse: '',
    aiCostUsd: null,
    ...overrides,
  };
}

/** What sending a page to the AI would cost. */
export function estimate(
  overrides: Partial<WebScrapeAiEstimateQuery['webScrapeAiEstimate']> = {},
): WebScrapeAiEstimateQuery['webScrapeAiEstimate'] {
  return {
    model: 'gpt-4o-mini',
    inputTokens: 1200,
    outputTokens: 400,
    costUsd: 0.0012,
    priced: true,
    truncated: false,
    ...overrides,
  };
}
