import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from '@testing-library/react';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { useScrape } from '../../../../src/pages/website-scraper/useScrape';
import { renderHookWithProviders } from '../../test-utils';

const gql = vi.hoisted(() => ({ scrape: vi.fn(), loading: false }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useScrapeWebsiteMutation: () => [gql.scrape, { loading: gql.loading }],
}));

function renderScrape() {
  const onScraped = vi.fn();
  const { result } = renderHookWithProviders(() => useScrape(onScraped));
  return { result, onScraped };
}

describe('useScrape', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.loading = false;
    vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
  });

  it('scrapes the URL and hands back the new scrape id', async () => {
    gql.scrape.mockResolvedValue({ data: { scrapeWebsite: { id: 'scrape-7' } } });
    const { result, onScraped } = renderScrape();

    await act(() => result.current.run('acme.com'));

    expect(gql.scrape).toHaveBeenCalledWith({ variables: { url: 'acme.com' } });
    expect(onScraped).toHaveBeenCalledWith('scrape-7');
    expect(result.current.error).toBeNull();
  });

  it('opens nothing when the server answers without data', async () => {
    gql.scrape.mockResolvedValue({ data: null });
    const { result, onScraped } = renderScrape();

    await act(() => result.current.run('acme.com'));

    expect(onScraped).not.toHaveBeenCalled();
    expect(result.current.error).toBeNull();
  });

  it("logs a failure and shows the server's reason, cleared on the next try", async () => {
    const failure = new Error('Firecrawl is out of credits');
    gql.scrape.mockRejectedValueOnce(failure);
    const { result } = renderScrape();

    await act(() => result.current.run('acme.com'));
    expect(result.current.error).toBe('Firecrawl is out of credits');
    expect(portalLogger.warn).toHaveBeenCalledWith('crm: scraping a website failed', failure);

    gql.scrape.mockResolvedValue({ data: { scrapeWebsite: { id: 'scrape-8' } } });
    await act(() => result.current.run('acme.com'));
    expect(result.current.error).toBeNull();
  });

  it('falls back to a plain message when the failure carries none', async () => {
    gql.scrape.mockRejectedValue('offline');
    const { result } = renderScrape();

    await act(() => result.current.run('acme.com'));

    expect(result.current.error).toBe('Could not scrape the page.');
  });

  it('reports when a scrape is running', () => {
    gql.loading = true;
    const { result } = renderScrape();

    expect(result.current.scraping).toBe(true);
  });
});
