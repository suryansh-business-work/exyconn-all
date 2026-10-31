import { afterEach, describe, expect, it, vi } from 'vitest';
import { InvoicesPage } from '../../../../src/pages/invoices/InvoicesPage';
import { dashboardProps, TABLE_INPUT } from '../../crud-dashboard-stub';
import { columnIds, formatCell, actionSpecs } from '../../grid-helpers';
import { renderWithProviders } from '../../test-utils';
import { invoiceRow } from '../fixtures';

const crud = vi.hoisted(() => ({
  select: null as null | ((data: unknown) => unknown),
  fetchRows: vi.fn(),
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

describe('InvoicesPage', () => {
  afterEach(() => vi.restoreAllMocks());

  it('hands the dashboard the invoice columns, CSV name and server-paged rows', async () => {
    renderWithProviders(<InvoicesPage />);
    const props = dashboardProps();
    expect(props.title).toBe('Invoices');
    expect(props.entityLabel).toBe('invoice');
    expect(props.exportFileName).toBe('invoices');
    expect(props.stats).toEqual([]);
    expect(props.context.formatDate('2026-10-14T00:00:00.000Z')).toBe('14 Oct 2026');

    const page = { rows: [invoiceRow()], totalCount: 1 };
    crud.fetchRows.mockResolvedValue(page);
    await expect(props.fetchRows(TABLE_INPUT)).resolves.toEqual(page);
    expect(crud.select?.({ vendorInvoices: page })).toBe(page);
  });

  it("shows what was sent, the buyer's review and the payment", () => {
    renderWithProviders(<InvoicesPage />);
    const columns = dashboardProps().columnDefs;
    expect(columnIds(columns)).toEqual([
      'invoiceNumber',
      'purchaseOrderNumber',
      'invoiceDate',
      'dueDate',
      'amount',
      'status',
      'paymentStatus',
      'paidOn',
      'reviewNote',
      'actions',
    ]);
    expect(formatCell(columns, 'amount', invoiceRow({ amount: 80.5, currency: 'EUR' }))).toBe(
      '€80.50',
    );
    expect(actionSpecs(columns).map((action) => action.key)).toEqual(['open']);
  });

  it('opens the invoice document in a new tab, cut off from this page', () => {
    const open = vi.spyOn(globalThis, 'open').mockReturnValue(null);
    renderWithProviders(<InvoicesPage />);
    dashboardProps().context.actions.open(invoiceRow() as never);
    expect(open).toHaveBeenCalledWith(
      'https://cdn.test/vendor-invoices/inv-77.pdf',
      '_blank',
      'noopener',
    );
  });
});
