import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ListMarketingSuppressionsPagedDocument } from '@exyconn/shell/graphql/generated';
import { SuppressionPage } from '../../../../src/pages/suppression';
import { SUPPRESSION_COLUMNS } from '../../../../src/pages/suppression/suppression-grid';
import { renderWithProviders } from '../../test-utils';
import { pending, suppressionRow, tableStats } from '../../fixtures';
import { dashboardProps, paged } from '../../crud-dashboard-stub';
import { confirmRowDelete, statLines } from '../../crud-page-helpers';

const gql = vi.hoisted(() => ({ stats: vi.fn(), refetch: vi.fn(), deleteSuppression: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListMarketingSuppressionsStatsQuery: () => gql.stats(),
  useDeleteMarketingSuppressionMutation: () => [gql.deleteSuppression],
}));

vi.mock('@exyconn/crud', async (importOriginal) => {
  const stub = await import('../../crud-dashboard-stub');
  return {
    ...(await importOriginal<typeof import('@exyconn/crud')>()),
    CrudDashboard: stub.CrudDashboardStub,
    usePagedFetcher: stub.usePagedFetcherStub,
  };
});

vi.mock('../../../../src/pages/suppression/forms/suppression', async () => ({
  SuppressionForm: (await import('../../form-stub')).FormStub,
}));

const STATS = tableStats(9, { reason: { UNSUBSCRIBED: 5, BOUNCED: 3, MANUAL: 1 } });

describe('SuppressionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.refetch.mockResolvedValue({});
    gql.deleteSuppression.mockResolvedValue({ data: { deleteMarketingSuppression: true } });
    gql.stats.mockReturnValue({
      data: { listMarketingSuppressionsStats: STATS },
      loading: false,
      refetch: gql.refetch,
    });
  });

  it('counts the suppressed addresses by why they are suppressed', () => {
    renderWithProviders(<SuppressionPage />);

    expect(statLines()).toEqual([
      'Suppressed: 9',
      'Unsubscribed: 5',
      'Bounced: 3',
      'Added by hand: 1',
    ]);
    expect(dashboardProps().statsLoading).toBe(false);
  });

  it('shows loading tiles at zero until the stats answer', () => {
    gql.stats.mockReturnValue(pending());
    renderWithProviders(<SuppressionPage />);

    expect(dashboardProps().statsLoading).toBe(true);
    expect(statLines()).toEqual([
      'Suppressed: 0',
      'Unsubscribed: 0',
      'Bounced: 0',
      'Added by hand: 0',
    ]);
  });

  it('drives the server grid with the paged suppressions query, adding by hand', () => {
    renderWithProviders(<SuppressionPage />);
    const page = { totalCount: 1, rows: [suppressionRow()] };

    expect(paged.document).toBe(ListMarketingSuppressionsPagedDocument);
    expect(paged.select?.({ listMarketingSuppressionsPaged: page } as never)).toBe(page);
    expect(dashboardProps().columnDefs).toBe(SUPPRESSION_COLUMNS);
    expect(Object.keys(dashboardProps().context.actions)).toEqual(['delete']);
    expect(dashboardProps()).toMatchObject({
      title: 'Suppression List',
      entityLabel: 'address',
      actionLabel: 'Add address',
      exportFileName: 'suppression-list',
    });
  });

  it('opens a blank form to add an address, and closes it once saved', async () => {
    renderWithProviders(<SuppressionPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Open new form' }));
    expect(screen.getByText('Blank form')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));
    expect(screen.queryByText('Blank form')).not.toBeInTheDocument();
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('puts an address back on the list only after confirming', async () => {
    renderWithProviders(<SuppressionPage />);

    await confirmRowDelete(
      suppressionRow({ id: 'suppression-4' }),
      'Remove gone@acme.io from the suppression list? Campaigns will be able to reach them again.',
    );

    expect(gql.deleteSuppression).toHaveBeenCalledWith({ variables: { id: 'suppression-4' } });
    expect(await screen.findByText('Suppression deleted')).toBeInTheDocument();
  });
});
