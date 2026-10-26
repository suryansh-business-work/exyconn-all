import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClutchRunStatus } from '@exyconn/shell/graphql/generated';
import { ClutchRunView } from '../../../../src/pages/clutch/ClutchRunView';
import { renderWithProviders } from '../../test-utils';
import { run } from './clutchFixtures';

const gql = vi.hoisted(() => ({
  run: vi.fn(),
  importCompanies: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
}));
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useClutchRunQuery: gql.run,
  useImportClutchCompaniesMutation: () => [gql.importCompanies, { loading: false }],
}));

const answer = (data: unknown, extra: Record<string, unknown> = {}) =>
  gql.run.mockReturnValue({
    data,
    error: undefined,
    startPolling: gql.start,
    stopPolling: gql.stop,
    ...extra,
  });

beforeEach(() => {
  vi.clearAllMocks();
  gql.importCompanies.mockResolvedValue({
    data: {
      importClutchCompanies: {
        created: 1,
        skipped: 1,
        contactsCreated: 1,
        filed: [],
        skips: [{ key: '9', name: 'Old', reason: 'Already in the CRM as Old', companyId: 'c9' }],
      },
    },
  });
});

describe('ClutchRunView', () => {
  it('shows progress and keeps asking while the search runs', () => {
    answer({ clutchRun: run({ status: ClutchRunStatus.Running }) });
    renderWithProviders(<ClutchRunView runId="r1" />);
    expect(screen.getByRole('status')).toHaveTextContent('Searching Clutch');
    expect(gql.start).toHaveBeenCalled();
  });

  it('says why a search failed, or why it could not be read', () => {
    answer({
      clutchRun: run({ status: ClutchRunStatus.Failed, error: 'Clutch answered HTTP 503.' }),
    });
    const { unmount } = renderWithProviders(<ClutchRunView runId="r1" />);
    expect(screen.getByText('Clutch answered HTTP 503.')).toBeInTheDocument();
    expect(gql.stop).toHaveBeenCalled();
    unmount();

    answer(undefined, { error: new Error('Forbidden') });
    renderWithProviders(<ClutchRunView runId="r1" />);
    expect(screen.getByText('Forbidden')).toBeInTheDocument();
  });

  it('lists the companies, marks those already filed, and files the chosen ones', async () => {
    answer({ clutchRun: run() });
    const user = userEvent.setup();
    renderWithProviders(<ClutchRunView runId="r1" />);

    expect(screen.getByText('Clutch’s own server returns its top matches.')).toBeInTheDocument();
    expect(screen.getByText('In the CRM')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Choose Acme' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Choose all' }));
    await user.click(screen.getByRole('button', { name: 'Add 1 to the CRM' }));

    await waitFor(() =>
      expect(gql.importCompanies).toHaveBeenCalledWith({ variables: { runId: 'r1', keys: ['1'] } }),
    );
    expect(
      await screen.findByText(/1 companies and 1 contacts added; 1 already in the CRM/),
    ).toBeInTheDocument();
    expect(screen.getByText('Old: Already in the CRM as Old')).toBeInTheDocument();
  });

  it('says when the search found nothing, and reports a failed filing', async () => {
    gql.importCompanies.mockRejectedValueOnce(new Error('No permission'));
    answer({ clutchRun: run({ companies: [], companyCount: 0, notes: [] }) });
    const { unmount } = renderWithProviders(<ClutchRunView runId="r1" />);
    expect(screen.getByText('Clutch found nothing for that search.')).toBeInTheDocument();
    unmount();

    answer({ clutchRun: run({ filedKeys: [] }) });
    const user = userEvent.setup();
    renderWithProviders(<ClutchRunView runId="r1" />);
    await user.click(screen.getByRole('checkbox', { name: 'Choose rtCamp' }));
    await user.click(screen.getByRole('checkbox', { name: 'Choose rtCamp' }));
    await user.click(screen.getByRole('checkbox', { name: 'Choose rtCamp' }));
    await user.click(screen.getByRole('button', { name: 'Add 1 to the CRM' }));
    expect(await screen.findByText('No permission')).toBeInTheDocument();
  });

  it('opens a company’s reviews, portfolio and people', async () => {
    answer({ clutchRun: run() });
    const user = userEvent.setup();
    renderWithProviders(<ClutchRunView runId="r1" />);

    await user.click(screen.getByRole('button', { name: 'Reviews, portfolio and people (3)' }));
    expect(await screen.findByText('Fast')).toBeInTheDocument();
    expect(screen.getByText('5.0 · $50k · Media · 2026-08-20')).toBeInTheDocument();
    expect(screen.getByText('— Jo, CTO')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Site' })).toBeInTheDocument();
    expect(screen.getByText('Sam · CEO · sam@rtcamp.com')).toBeInTheDocument();
    expect(screen.getAllByText(/Hourly rate/)).toHaveLength(2);
    await user.click(screen.getByRole('button', { name: 'Hide reviews and portfolio' }));
  });
});
