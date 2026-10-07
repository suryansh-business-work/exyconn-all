import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ListPurchaseOrdersPagedDocument } from '@exyconn/shell/graphql/generated';
import { PurchaseOrdersPage } from '../../../../src/pages/purchase-orders';
import { PURCHASE_ORDER_COLUMNS } from '../../../../src/pages/purchase-orders/purchase-orders-grid';
import { renderWithProviders } from '../../test-utils';
import { pending, purchaseOrderRow, tableStats } from '../../fixtures';
import { dashboardProps, paged } from '../../crud-dashboard-stub';
import { confirmRowDelete, runRowAction, statLines } from '../../crud-page-helpers';

const gql = vi.hoisted(() => ({ stats: vi.fn(), refetch: vi.fn(), deleteOrder: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListPurchaseOrdersStatsQuery: () => gql.stats(),
  useDeletePurchaseOrderMutation: () => [gql.deleteOrder],
}));

vi.mock('@exyconn/crud', async (importOriginal) => {
  const stub = await import('../../crud-dashboard-stub');
  return {
    ...(await importOriginal<typeof import('@exyconn/crud')>()),
    CrudDashboard: stub.CrudDashboardStub,
    usePagedFetcher: stub.usePagedFetcherStub,
  };
});

vi.mock('../../../../src/pages/purchase-orders/forms/purchase-order', async () => ({
  PurchaseOrderForm: (await import('../../form-stub')).FormStub,
}));

/** The receive form has its own test; here it shows its order and the page's callbacks. */
vi.mock('../../../../src/pages/purchase-orders/ReceiveOrderForm', () => ({
  ReceiveOrderForm: ({
    order,
    onCancel,
    onDone,
  }: Readonly<{ order: { number: string }; onCancel: () => void; onDone: () => void }>) => (
    <div>
      <p>{`Receiving ${order.number}`}</p>
      <button type="button" onClick={onCancel}>
        Cancel receive
      </button>
      <button type="button" onClick={onDone}>
        Finish receive
      </button>
    </div>
  ),
}));

describe('PurchaseOrdersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.refetch.mockResolvedValue({});
    gql.deleteOrder.mockResolvedValue({ data: { deletePurchaseOrder: true } });
    gql.stats.mockReturnValue({
      data: {
        listPurchaseOrdersStats: tableStats(9, {
          status: { ORDERED: 3, PARTIALLY_RECEIVED: 2, RECEIVED: 4 },
        }),
      },
      loading: false,
      refetch: gql.refetch,
    });
  });

  it('counts the orders by where they are in delivery', () => {
    renderWithProviders(<PurchaseOrdersPage />);

    expect(statLines()).toEqual(['Orders: 9', 'Ordered: 3', 'Part received: 2', 'Received: 4']);
    expect(dashboardProps().statsLoading).toBe(false);
  });

  it('marks the tiles loading until the stats answer', () => {
    gql.stats.mockReturnValue(pending());
    renderWithProviders(<PurchaseOrdersPage />);

    expect(dashboardProps().statsLoading).toBe(true);
    expect(statLines()[0]).toBe('Orders: 0');
  });

  it('drives the server grid with the paged orders query, its columns and a date formatter', () => {
    renderWithProviders(<PurchaseOrdersPage />);
    const page = { totalCount: 1, rows: [purchaseOrderRow()] };

    expect(paged.document).toBe(ListPurchaseOrdersPagedDocument);
    expect(paged.select?.({ listPurchaseOrdersPaged: page } as never)).toBe(page);
    expect(dashboardProps().columnDefs).toBe(PURCHASE_ORDER_COLUMNS);
    expect(typeof dashboardProps().context.formatDate).toBe('function');
    expect(dashboardProps()).toMatchObject({
      title: 'Purchase orders',
      exportFileName: 'purchase-orders',
    });
  });

  it('opens the form blank for a new order and with the row for an edit', async () => {
    renderWithProviders(<PurchaseOrdersPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Open new form' }));
    expect(screen.getByText('Blank form')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel form' }));

    await runRowAction('edit', purchaseOrderRow({ number: 'PO-0042' }));
    expect(screen.getByText(/"number":"PO-0042"/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));
    expect(screen.queryByText(/PO-0042/)).not.toBeInTheDocument();
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('books stock in against an order, then reloads and closes the panel', async () => {
    renderWithProviders(<PurchaseOrdersPage />);
    expect(screen.queryByText(/Receiving/)).not.toBeInTheDocument();

    await runRowAction('receive', purchaseOrderRow({ number: 'PO-0007' }));
    expect(screen.getByRole('heading', { name: 'Book stock in' })).toBeInTheDocument();
    expect(screen.getByText('Receiving PO-0007')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Finish receive' }));
    expect(screen.queryByText(/Receiving/)).not.toBeInTheDocument();
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('closes the receive panel without reloading when it is cancelled', async () => {
    renderWithProviders(<PurchaseOrdersPage />);

    await runRowAction('receive', purchaseOrderRow());
    await userEvent.click(screen.getByRole('button', { name: 'Cancel receive' }));

    expect(screen.queryByText(/Receiving/)).not.toBeInTheDocument();
    expect(gql.refetch).not.toHaveBeenCalled();
  });

  it('closes the receive panel from its close button', async () => {
    renderWithProviders(<PurchaseOrdersPage />);

    await runRowAction('receive', purchaseOrderRow());
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(screen.queryByText(/Receiving/)).not.toBeInTheDocument();
  });

  it('deletes an order after confirming that received stock stays put', async () => {
    renderWithProviders(<PurchaseOrdersPage />);

    await confirmRowDelete(
      purchaseOrderRow({ id: 'po-4', number: 'PO-0004' }),
      'Delete PO-0004? Stock already received stays where it is.',
    );

    expect(gql.deleteOrder).toHaveBeenCalledWith({ variables: { id: 'po-4' } });
    expect(await screen.findByText('Purchase order deleted')).toBeInTheDocument();
  });
});
