import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import type { WebScrapeFieldsFragment } from '@exyconn/shell/graphql/generated';
import { ScrapeDetailDialog } from '../../../../src/pages/website-scraper/ScrapeDetailDialog';
import { renderWithProviders } from '../../test-utils';
import { scrapeRow } from './scraper-fixtures';

const gql = vi.hoisted(() => ({
  options: null as { variables: { id: string }; skip: boolean } | null,
  result: {} as {
    data?: { getWebScrape: WebScrapeFieldsFragment };
    loading?: boolean;
    error?: Error;
  },
  refetch: vi.fn(),
  run: vi.fn(),
  deleting: false,
  onDeleted: null as (() => void) | null,
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useGetWebScrapeQuery: (options: typeof gql.options) => {
    gql.options = options;
    return { ...gql.result, refetch: gql.refetch };
  },
}));

vi.mock('../../../../src/pages/website-scraper/useDeleteScrape', () => ({
  useDeleteScrape: (onDeleted: () => void) => {
    gql.onDeleted = onDeleted;
    return { run: gql.run, deleting: gql.deleting };
  },
}));

vi.mock('../../../../src/pages/website-scraper/AiAnalysisPanel', () => ({
  AiAnalysisPanel: ({ scrape }: Readonly<{ scrape: WebScrapeFieldsFragment }>) => (
    <p>AI step for {scrape.id}</p>
  ),
}));

function renderDialog(scrapeId: string | null = 'scrape-1') {
  const onClose = vi.fn();
  const onDeleted = vi.fn();
  renderWithProviders(
    <ScrapeDetailDialog scrapeId={scrapeId} onClose={onClose} onDeleted={onDeleted} />,
  );
  return { onClose, onDeleted };
}

describe('ScrapeDetailDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.result = { data: { getWebScrape: scrapeRow() }, loading: false };
    gql.deleting = false;
    gql.refetch.mockResolvedValue({});
    gql.run.mockResolvedValue(undefined);
    vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
  });

  it('stays closed and fetches nothing without a page to show', () => {
    gql.result = {};
    renderDialog(null);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(gql.options).toEqual({ variables: { id: '' }, skip: true });
  });

  it('shows the page: its link, its text and the AI step', () => {
    renderDialog();

    expect(gql.options).toEqual({ variables: { id: 'scrape-1' }, skip: false });
    expect(screen.getByRole('dialog', { name: 'About Acme' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'https://acme.com/about' })).toHaveAttribute(
      'target',
      '_blank',
    );
    expect(screen.getByRole('region', { name: 'Page text' })).toBeInTheDocument();
    expect(screen.getByText('AI step for scrape-1')).toBeInTheDocument();
  });

  it('falls back to a generic title for an untitled page', () => {
    gql.result = { data: { getWebScrape: scrapeRow({ title: '' }) } };
    renderDialog();

    expect(screen.getByRole('dialog', { name: 'Scraped page' })).toBeInTheDocument();
  });

  it('shows a skeleton while the page loads, with no Delete yet', () => {
    gql.result = { loading: true };
    renderDialog();

    expect(screen.getByRole('status')).toHaveTextContent('Loading the scraped page');
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
  });

  it('shows an empty body when nothing came back and nothing is loading', () => {
    gql.result = { loading: false };
    renderDialog();

    expect(screen.getByRole('dialog', { name: 'Scraped page' })).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('explains a failed load and retries it', async () => {
    gql.result = { error: new Error('Scrape not found') };
    renderDialog();

    expect(screen.getByRole('alert')).toHaveTextContent('Scrape not found');
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('logs a retry that fails', async () => {
    const failure = new Error('offline');
    gql.refetch.mockRejectedValue(failure);
    gql.result = { error: new Error('Scrape not found') };
    renderDialog();

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() =>
      expect(portalLogger.warn).toHaveBeenCalledWith(
        'crm: reloading a scraped page failed',
        failure,
      ),
    );
  });

  it('deletes the open page and hands the caller its deleted callback', async () => {
    const { onDeleted } = renderDialog();

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(gql.run).toHaveBeenCalledWith(scrapeRow());
    expect(gql.onDeleted).toBe(onDeleted);
  });

  it('logs a delete that fails unexpectedly', async () => {
    const failure = new Error('boom');
    gql.run.mockRejectedValue(failure);
    renderDialog();

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() =>
      expect(portalLogger.warn).toHaveBeenCalledWith(
        'crm: deleting a scraped page failed',
        failure,
      ),
    );
  });

  it('locks Delete while a delete runs, and closes on Close', async () => {
    gql.deleting = true;
    const { onClose } = renderDialog();

    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
