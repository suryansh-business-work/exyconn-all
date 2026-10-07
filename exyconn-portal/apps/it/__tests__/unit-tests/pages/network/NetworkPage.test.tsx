import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ListItNetworkItemsPagedDocument } from '@exyconn/shell/graphql/generated';
import { NetworkPage } from '../../../../src/pages/network';
import { NETWORK_COLUMNS } from '../../../../src/pages/network/network-grid';
import { renderWithProviders } from '../../test-utils';
import { networkRow, pending, tableStats } from '../page-kit/fixtures';
import { dashboardProps, paged } from '../page-kit/crud-dashboard.stub';
import { answerRowConfirm, runRowAction, statLines } from '../page-kit/page-actions';

const gql = vi.hoisted(() => ({ stats: vi.fn(), refetch: vi.fn(), remove: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListItNetworkItemsStatsQuery: () => gql.stats(),
  useDeleteItNetworkItemMutation: () => [gql.remove],
}));

vi.mock('@exyconn/crud', async (importOriginal) => {
  const stub = await import('../page-kit/crud-dashboard.stub');
  return {
    ...(await importOriginal<typeof import('@exyconn/crud')>()),
    CrudDashboard: stub.CrudDashboardStub,
    usePagedFetcher: stub.usePagedFetcherStub,
  };
});

vi.mock('../../../../src/pages/network/forms/network-item', async () => ({
  NetworkItemForm: (await import('../page-kit/form.stub')).FormStub,
}));

describe('NetworkPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.refetch.mockResolvedValue({});
    gql.remove.mockResolvedValue({ data: { deleteItNetworkItem: true } });
    const stats = tableStats(9, { status: { ACTIVE: 6, DEGRADED: 2, DOWN: 1 } });
    gql.stats.mockReturnValue({
      data: { listItNetworkItemsStats: stats },
      loading: false,
      refetch: gql.refetch,
    });
  });

  it('counts the network items by health', () => {
    renderWithProviders(<NetworkPage />);

    expect(statLines()).toEqual(['Network items: 9', 'Active: 6', 'Degraded: 2', 'Down: 1']);
    expect(dashboardProps().statsLoading).toBe(false);
  });

  it('shows zeros while the stats load', () => {
    gql.stats.mockReturnValue(pending());
    renderWithProviders(<NetworkPage />);

    expect(statLines()).toEqual(['Network items: 0', 'Active: 0', 'Degraded: 0', 'Down: 0']);
    expect(dashboardProps().statsLoading).toBe(true);
  });

  it('drives the server grid with the paged network query, gated by its permission module', () => {
    renderWithProviders(<NetworkPage />);
    const page = { totalCount: 1, rows: [networkRow()] };

    expect(paged.document).toBe(ListItNetworkItemsPagedDocument);
    expect(paged.select?.({ listItNetworkItemsPaged: page } as never)).toBe(page);
    expect(dashboardProps()).toMatchObject({
      title: 'Network',
      exportFileName: 'network',
      permissionModule: 'ItNetworkItem',
      columnDefs: NETWORK_COLUMNS,
    });
  });

  it('opens the form blank or with the row, and reloads the stats after a save', async () => {
    renderWithProviders(<NetworkPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Open new form' }));
    expect(screen.getByText('Blank form')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel form' }));

    await runRowAction('edit', networkRow({ name: 'Staff VPN' }));
    expect(screen.getByText(/"name":"Staff VPN"/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));

    expect(screen.queryByText(/Staff VPN/)).not.toBeInTheDocument();
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('deletes a network item by id once confirmed', async () => {
    renderWithProviders(<NetworkPage />);

    await answerRowConfirm(
      'delete',
      networkRow({ id: 'net-4' }),
      'Delete "Office Wi-Fi"?',
      'Delete',
    );

    expect(gql.remove).toHaveBeenCalledWith({ variables: { id: 'net-4' } });
    expect(await screen.findByText('Network item deleted')).toBeInTheDocument();
  });
});
