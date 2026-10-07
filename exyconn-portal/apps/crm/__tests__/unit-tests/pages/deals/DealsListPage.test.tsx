import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { formatMoney } from '@exyconn/shell/utils/money';
import { ListDealsPagedDocument } from '@exyconn/shell/graphql/generated';
import { DealsListPage } from '../../../../src/pages/deals';
import { DEAL_COLUMNS } from '../../../../src/pages/deals/deals-grid';
import { renderWithProviders } from '../../test-utils';
import { dealRow, pending, tableStats } from '../../fixtures';
import { dashboardProps, paged } from '../../crud-dashboard-stub';
import { confirmRowDelete, runRowAction, statLines } from '../../crud-page-helpers';

const gql = vi.hoisted(() => ({
  stats: vi.fn(),
  refetch: vi.fn(),
  deleteDeal: vi.fn(),
  createInvoice: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListDealsStatsQuery: () => gql.stats(),
  useDeleteDealMutation: () => [gql.deleteDeal],
}));

vi.mock('../../../../src/pages/deals/useCreateInvoiceFromDeal', () => ({
  useCreateInvoiceFromDeal: () => gql.createInvoice,
}));

vi.mock('@exyconn/crud', async (importOriginal) => {
  const stub = await import('../../crud-dashboard-stub');
  return {
    ...(await importOriginal<typeof import('@exyconn/crud')>()),
    CrudDashboard: stub.CrudDashboardStub,
    usePagedFetcher: stub.usePagedFetcherStub,
  };
});

vi.mock('../../../../src/pages/deals/forms/deal', async () => ({
  DealForm: (await import('../../form-stub')).FormStub,
}));

describe('DealsListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.refetch.mockResolvedValue({});
    gql.deleteDeal.mockResolvedValue({ data: { deleteDeal: true } });
    gql.stats.mockReturnValue({
      data: { listDealsStats: tableStats(6, { stage: { WON: 2, LOST: 1 } }, { value: 450000 }) },
      loading: false,
      refetch: gql.refetch,
    });
  });

  it('totals the deals and counts won and lost from the stats query', () => {
    renderWithProviders(<DealsListPage />, { route: '/crm/deals/list' });

    expect(statLines()).toEqual([
      'Deals: 6',
      `Total value: ${formatMoney(450000)}`,
      'Won: 2',
      'Lost: 1',
    ]);
    expect(dashboardProps().statsLoading).toBe(false);
  });

  it('marks the tiles loading until the stats answer', () => {
    gql.stats.mockReturnValue(pending());
    renderWithProviders(<DealsListPage />, { route: '/crm/deals/list' });

    expect(dashboardProps().statsLoading).toBe(true);
    expect(statLines()[1]).toBe(`Total value: ${formatMoney(0)}`);
  });

  it('shows the board/list switch with the list selected', () => {
    renderWithProviders(<DealsListPage />, { route: '/crm/deals/list' });

    expect(screen.getByRole('button', { name: 'list view' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('drives the server grid with the paged deals query, the deal columns and date formatting', () => {
    renderWithProviders(<DealsListPage />, { route: '/crm/deals/list' });
    const page = { totalCount: 1, rows: [dealRow()] };

    expect(paged.document).toBe(ListDealsPagedDocument);
    expect(paged.select?.({ listDealsPaged: page } as never)).toBe(page);
    expect(dashboardProps().columnDefs).toBe(DEAL_COLUMNS);
    expect(dashboardProps().context.formatDate).toEqual(expect.any(Function));
    expect(dashboardProps()).toMatchObject({ title: 'Deals', exportFileName: 'deals' });
  });

  it('hands the invoice action straight to the create-invoice hook', async () => {
    renderWithProviders(<DealsListPage />, { route: '/crm/deals/list' });
    const won = dealRow({ id: 'deal-3' });

    await runRowAction('createInvoice', won);

    expect(gql.createInvoice).toHaveBeenCalledWith(won);
  });

  it('opens the form blank for a new deal and with the row for an edit', async () => {
    renderWithProviders(<DealsListPage />, { route: '/crm/deals/list' });

    await userEvent.click(screen.getByRole('button', { name: 'Open new form' }));
    expect(screen.getByText('Blank form')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel form' }));

    await runRowAction('edit', dealRow({ title: 'Globex renewal' }));
    expect(screen.getByText(/"title":"Globex renewal"/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('deletes a deal after confirming, by its id', async () => {
    renderWithProviders(<DealsListPage />, { route: '/crm/deals/list' });

    await confirmRowDelete(dealRow({ id: 'deal-6' }), 'Delete deal "Acme rollout"?');

    expect(gql.deleteDeal).toHaveBeenCalledWith({ variables: { id: 'deal-6' } });
    expect(await screen.findByText('Deal deleted')).toBeInTheDocument();
  });
});
