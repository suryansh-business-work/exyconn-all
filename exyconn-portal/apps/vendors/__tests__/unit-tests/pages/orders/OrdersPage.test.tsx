import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrdersPage } from '../../../../src/pages/orders/OrdersPage';
import { ORDER_COLUMNS } from '../../../../src/pages/orders/orders-grid';
import { dashboardProps, TABLE_INPUT } from '../../crud-dashboard-stub';
import { renderWithProviders } from '../../test-utils';
import { orderRow } from '../fixtures';

const gql = vi.hoisted(() => ({ acknowledge: vi.fn() }));
const crud = vi.hoisted(() => ({
  select: null as null | ((data: unknown) => unknown),
  fetchRows: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useVendorAcknowledgePurchaseOrderMutation: () => [gql.acknowledge],
}));
vi.mock('@exyconn/crud', async (importOriginal) => {
  const { CrudDashboardStub } = await import('../../crud-dashboard-stub');
  return {
    ...(await importOriginal<Record<string, unknown>>()),
    CrudDashboard: CrudDashboardStub,
    usePagedFetcher: (_document: unknown, select: (data: unknown) => unknown) => {
      crud.select = select;
      return crud.fetchRows;
    },
  };
});
/** The invoice form has its own tests; here it only reports that it finished or was cancelled. */
vi.mock('../../../../src/pages/orders/forms/vendor-invoice', () => ({
  VendorInvoiceForm: ({
    order,
    onDone,
    onCancel,
  }: Readonly<{ order: { number: string }; onDone: () => void; onCancel: () => void }>) => (
    <div>
      <p>Invoice form for {order.number}</p>
      <button type="button" onClick={onDone}>
        Finish invoice
      </button>
      <button type="button" onClick={onCancel}>
        Abandon invoice
      </button>
    </div>
  ),
}));

const ORDER = orderRow();
const refreshSignal = () => dashboardProps().refreshSignal;

function renderPage() {
  renderWithProviders(<OrdersPage />);
  return userEvent.setup();
}

const acknowledgeRow = () =>
  act(() => dashboardProps().context.actions.acknowledge(ORDER as never));

describe('OrdersPage', () => {
  beforeEach(() => {
    gql.acknowledge.mockResolvedValue({ data: { vendorAcknowledgePurchaseOrder: { id: 'po-1' } } });
  });
  afterEach(() => vi.clearAllMocks());

  it('hands the dashboard the order columns, CSV name and server-paged rows', async () => {
    renderPage();
    const props = dashboardProps();
    expect(props.title).toBe('Purchase orders');
    expect(props.entityLabel).toBe('purchase order');
    expect(props.exportFileName).toBe('purchase-orders');
    expect(props.columnDefs).toBe(ORDER_COLUMNS);
    expect(props.refreshSignal).toBe(0);
    expect(props.context.formatDate('2026-10-14T00:00:00.000Z')).toBe('14 Oct 2026');

    const page = { rows: [ORDER], totalCount: 1 };
    crud.fetchRows.mockResolvedValue(page);
    await expect(props.fetchRows(TABLE_INPUT)).resolves.toEqual(page);
    expect(crud.select?.({ vendorPurchaseOrders: page })).toBe(page);
  });

  it('acknowledges an order once the supplier confirms, then refreshes the list', async () => {
    const user = renderPage();
    acknowledgeRow();
    expect(
      await screen.findByText('Confirm that you have received order PO-0001?'),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Acknowledge' }));

    expect(await screen.findByText('Order PO-0001 acknowledged')).toBeInTheDocument();
    expect(gql.acknowledge).toHaveBeenCalledWith({ variables: { id: 'po-1' } });
    expect(refreshSignal()).toBe(1);
  });

  it('does nothing when the supplier backs out of the confirmation', async () => {
    const user = renderPage();
    acknowledgeRow();
    await user.click(await screen.findByRole('button', { name: 'Cancel' }));

    await waitFor(() =>
      expect(
        screen.queryByText('Confirm that you have received order PO-0001?'),
      ).not.toBeInTheDocument(),
    );
    expect(gql.acknowledge).not.toHaveBeenCalled();
    expect(refreshSignal()).toBe(0);
  });

  it('says why an acknowledgement failed and leaves the list as it was', async () => {
    gql.acknowledge.mockRejectedValueOnce(new Error('This order has already been acknowledged.'));
    const user = renderPage();
    acknowledgeRow();
    await user.click(await screen.findByRole('button', { name: 'Acknowledge' }));

    expect(
      await screen.findByText('This order has already been acknowledged.'),
    ).toBeInTheDocument();
    expect(refreshSignal()).toBe(0);
  });

  it('logs a confirmation that could not be shown at all', async () => {
    const failure = new Error('confirm broke');
    const shell = await import('@exyconn/shell/components/feedback/ConfirmProvider');
    const confirm = vi.spyOn(shell, 'useConfirm').mockReturnValue(() => Promise.reject(failure));
    const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    renderPage();
    acknowledgeRow();

    await waitFor(() => expect(logged).toHaveBeenCalledWith('Acknowledge failed', failure));
    expect(gql.acknowledge).not.toHaveBeenCalled();
    confirm.mockRestore();
    logged.mockRestore();
  });

  it('opens the invoice form for an order and refreshes once an invoice is sent', async () => {
    const user = renderPage();
    act(() => dashboardProps().context.actions.invoice(ORDER as never));
    expect(await screen.findByText('Invoice for PO-0001')).toBeInTheDocument();
    expect(screen.getByText('Invoice form for PO-0001')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Finish invoice' }));
    await waitFor(() =>
      expect(screen.queryByText('Invoice form for PO-0001')).not.toBeInTheDocument(),
    );
    expect(refreshSignal()).toBe(1);
  });

  it('closes the invoice form without refreshing when it is abandoned', async () => {
    const user = renderPage();
    act(() => dashboardProps().context.actions.invoice(ORDER as never));
    await user.click(await screen.findByRole('button', { name: 'Abandon invoice' }));
    await waitFor(() =>
      expect(screen.queryByText('Invoice form for PO-0001')).not.toBeInTheDocument(),
    );
    expect(refreshSignal()).toBe(0);
  });

  it('closes the invoice dialog from its own close control', async () => {
    const user = renderPage();
    act(() => dashboardProps().context.actions.invoice(ORDER as never));
    await screen.findByText('Invoice form for PO-0001');
    await user.keyboard('{Escape}');
    await waitFor(() =>
      expect(screen.queryByText('Invoice form for PO-0001')).not.toBeInTheDocument(),
    );
    expect(refreshSignal()).toBe(0);
  });
});
