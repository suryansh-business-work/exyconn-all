import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { WebsiteScraperPage } from '../../../../src/pages/website-scraper';
import { renderWithProviders } from '../../test-utils';
import { press } from '../../form-helpers';

const mocks = vi.hoisted(() => ({
  ready: {} as { data?: { firecrawlReady: boolean }; loading?: boolean; error?: Error },
  refetch: vi.fn(),
  run: vi.fn(),
  scraping: false,
  scrapeError: null as string | null,
  onScraped: null as ((id: string) => void) | null,
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useFirecrawlReadyQuery: () => ({ ...mocks.ready, refetch: mocks.refetch }),
}));

vi.mock('../../../../src/pages/website-scraper/useScrape', () => ({
  useScrape: (onScraped: (id: string) => void) => {
    mocks.onScraped = onScraped;
    return { run: mocks.run, scraping: mocks.scraping, error: mocks.scrapeError };
  },
}));

vi.mock('../../../../src/pages/website-scraper/ScrapesGrid', () => ({
  ScrapesGrid: ({
    refreshSignal,
    onOpen,
  }: Readonly<{ refreshSignal: number; onOpen: (row: { id: string }) => void }>) => (
    <div>
      <p>Grid refresh {refreshSignal}</p>
      <button type="button" onClick={() => onOpen({ id: 'scrape-2' })}>
        Open row
      </button>
    </div>
  ),
}));

vi.mock('../../../../src/pages/website-scraper/ScrapeDetailDialog', () => ({
  ScrapeDetailDialog: ({
    scrapeId,
    onClose,
    onDeleted,
  }: Readonly<{ scrapeId: string | null; onClose: () => void; onDeleted: () => void }>) => (
    <div>
      <p>Open scrape {scrapeId ?? 'none'}</p>
      <button type="button" onClick={onClose}>
        Close detail
      </button>
      <button type="button" onClick={onDeleted}>
        Deleted detail
      </button>
    </div>
  ),
}));

function renderPage(route = '/tools/website-scraper') {
  renderWithProviders(<WebsiteScraperPage />, { route });
}

describe('WebsiteScraperPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.ready = { data: { firecrawlReady: true }, loading: false };
    mocks.scraping = false;
    mocks.scrapeError = null;
    mocks.refetch.mockResolvedValue({});
    mocks.run.mockResolvedValue(undefined);
    vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
  });

  it('shows a skeleton while it checks Firecrawl is configured', () => {
    mocks.ready = { loading: true };
    renderPage();

    expect(screen.getByRole('heading', { name: 'Website scraper' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Loading the website scraper');
  });

  it('points to Tech when Firecrawl is not configured', () => {
    mocks.ready = { data: { firecrawlReady: false }, loading: false };
    renderPage();

    expect(
      screen.getByRole('link', { name: 'Tech > Environment Variables > Firecrawl' }),
    ).toHaveAttribute('href', expect.stringContaining('/tech/environment-variables/firecrawl'));
    expect(screen.queryByLabelText('Website')).not.toBeInTheDocument();
  });

  it('explains a failed check and retries it', async () => {
    mocks.ready = { error: new Error('Network down') };
    renderPage();

    expect(screen.getByRole('alert')).toHaveTextContent('Network down');
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(mocks.refetch).toHaveBeenCalledTimes(1);
  });

  it('logs a retry that fails', async () => {
    const failure = new Error('offline');
    mocks.refetch.mockRejectedValue(failure);
    mocks.ready = { error: new Error('Network down') };
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() =>
      expect(portalLogger.warn).toHaveBeenCalledWith(
        'crm: reloading whether Firecrawl is configured',
        failure,
      ),
    );
  });

  it('keeps the workspace when a refresh fails after Firecrawl was found ready', () => {
    mocks.ready = { data: { firecrawlReady: true }, loading: true, error: new Error('blip') };
    renderPage();

    expect(screen.getByLabelText('Website')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('prefills the address from ?url= and scrapes it on submit', async () => {
    renderPage('/tools/website-scraper?url=acme.com');

    expect(screen.getByLabelText('Website')).toHaveValue('acme.com');
    await press('Scrape');

    expect(mocks.run).toHaveBeenCalledWith('acme.com');
  });

  it('logs a scrape that fails unexpectedly', async () => {
    const failure = new Error('boom');
    mocks.run.mockRejectedValue(failure);
    renderPage('/tools/website-scraper?url=acme.com');

    await press('Scrape');

    await waitFor(() =>
      expect(portalLogger.warn).toHaveBeenCalledWith('crm: scraping a website', failure),
    );
  });

  it('shows why a scrape failed', () => {
    mocks.scrapeError = 'Firecrawl is out of credits';
    renderPage();

    expect(screen.getByRole('alert')).toHaveTextContent('Firecrawl is out of credits');
  });

  it('opens a new scrape straight away and refreshes the list', async () => {
    renderPage();
    expect(screen.getByText('Open scrape none')).toBeInTheDocument();

    act(() => mocks.onScraped?.('scrape-9'));

    expect(await screen.findByText('Open scrape scrape-9')).toBeInTheDocument();
    expect(screen.getByText('Grid refresh 1')).toBeInTheDocument();
  });

  it('opens a row from the list, and refreshes the list when the page closes or is deleted', async () => {
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: 'Open row' }));
    expect(screen.getByText('Open scrape scrape-2')).toBeInTheDocument();
    expect(screen.getByText('Grid refresh 0')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Close detail' }));
    expect(screen.getByText('Open scrape none')).toBeInTheDocument();
    expect(screen.getByText('Grid refresh 1')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Open row' }));
    await userEvent.click(screen.getByRole('button', { name: 'Deleted detail' }));
    expect(screen.getByText('Open scrape none')).toBeInTheDocument();
    expect(screen.getByText('Grid refresh 2')).toBeInTheDocument();
  });
});
