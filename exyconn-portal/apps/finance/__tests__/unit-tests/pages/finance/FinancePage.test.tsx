import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ListInvoicesPagedDocument } from '@exyconn/shell/graphql/generated';
import { FinancePage } from '../../../../src/pages/finance';
import { INVOICE_COLUMNS } from '../../../../src/pages/finance/invoices-grid';
import { renderWithProviders } from '../../test-utils';
import { invoiceRow, pending, tableStats } from '../../fixtures';
import { dashboardProps, paged } from '../../crud-dashboard-stub';
import { confirmRowDelete, runRowAction, statLines } from '../../crud-page-helpers';

const gql = vi.hoisted(() => ({ stats: vi.fn(), refetch: vi.fn(), deleteInvoice: vi.fn() }));
const pdf = vi.hoisted(() => ({ download: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListInvoicesStatsQuery: () => gql.stats(),
  useDeleteInvoiceMutation: () => [gql.deleteInvoice],
}));

vi.mock('@exyconn/crud', async (importOriginal) => {
  const stub = await import('../../crud-dashboard-stub');
  return {
    ...(await importOriginal<typeof import('@exyconn/crud')>()),
    CrudDashboard: stub.CrudDashboardStub,
    usePagedFetcher: stub.usePagedFetcherStub,
  };
});

vi.mock('../../../../src/pages/finance/useInvoiceDownload', () => ({
  useInvoiceDownload: () => ({ download: pdf.download, downloading: false }),
}));

vi.mock('../../../../src/pages/finance/forms/invoice', async () => ({
  InvoiceForm: (await import('../../form-stub')).FormStub,
}));

vi.mock('../../../../src/pages/finance/forms/send-invoice', async () => ({
  SendInvoiceForm: (await import('../../form-stub')).FormStub,
}));

describe('FinancePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.refetch.mockResolvedValue({});
    gql.deleteInvoice.mockResolvedValue({ data: { deleteInvoice: true } });
    pdf.download.mockResolvedValue(undefined);
    gql.stats.mockReturnValue({
      data: {
        listInvoicesStats: tableStats(7, { status: { PAID: 3, OVERDUE: 2 } }, { amount: 900 }),
      },
      loading: false,
      refetch: gql.refetch,
    });
  });

  it('counts the invoices, revenue, paid and overdue from the stats query', () => {
    renderWithProviders(<FinancePage />);

    expect(statLines()).toEqual(['Invoices: 7', 'Revenue: ₹900', 'Paid: 3', 'Overdue: 2']);
    expect(dashboardProps().statsLoading).toBe(false);
  });

  it('marks the tiles loading until the stats answer, showing zeros meanwhile', () => {
    gql.stats.mockReturnValue(pending());
    renderWithProviders(<FinancePage />);

    expect(dashboardProps().statsLoading).toBe(true);
    expect(statLines()).toEqual(['Invoices: 0', 'Revenue: ₹0', 'Paid: 0', 'Overdue: 0']);
  });

  it('drives the server grid with the paged invoices query and the invoice columns', () => {
    renderWithProviders(<FinancePage />);
    const page = { totalCount: 1, rows: [invoiceRow()] };

    expect(paged.document).toBe(ListInvoicesPagedDocument);
    expect(paged.select?.({ listInvoicesPaged: page } as never)).toBe(page);
    expect(dashboardProps()).toMatchObject({
      title: 'Finance',
      exportFileName: 'invoices',
      permissionModule: 'Invoice',
      columnDefs: INVOICE_COLUMNS,
    });
    expect(dashboardProps().context.formatDate).toEqual(expect.any(Function));
  });

  it('downloads an invoice by its id and number', async () => {
    renderWithProviders(<FinancePage />);

    await runRowAction('download', invoiceRow({ id: 'invoice-9', number: 'INV-009' }));

    expect(pdf.download).toHaveBeenCalledWith('invoice-9', 'INV-009');
  });

  it('opens the send panel for an invoice, and closes it from cancel or the close button', async () => {
    renderWithProviders(<FinancePage />);

    await runRowAction('send', invoiceRow({ number: 'INV-042' }));
    expect(screen.getByRole('heading', { name: 'Send invoice' })).toBeInTheDocument();
    expect(screen.getByText(/"number":"INV-042"/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel form' }));
    expect(screen.queryByText(/INV-042/)).not.toBeInTheDocument();

    await runRowAction('send', invoiceRow({ number: 'INV-043' }));
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByText(/INV-043/)).not.toBeInTheDocument();
  });

  it('reloads the stats and closes the panel once an invoice is sent', async () => {
    renderWithProviders(<FinancePage />);

    await runRowAction('send', invoiceRow({ number: 'INV-044' }));
    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));

    expect(gql.refetch).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/INV-044/)).not.toBeInTheDocument();
  });

  it('opens the invoice form blank for a new invoice and with the row for an edit', async () => {
    renderWithProviders(<FinancePage />);

    await userEvent.click(screen.getByRole('button', { name: 'Open new form' }));
    expect(screen.getByText('Blank form')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel form' }));
    expect(screen.queryByText('Blank form')).not.toBeInTheDocument();

    await runRowAction('edit', invoiceRow({ number: 'INV-077' }));
    expect(screen.getByText(/"number":"INV-077"/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));
    expect(screen.queryByText(/INV-077/)).not.toBeInTheDocument();
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('deletes an invoice after confirming, naming it by number', async () => {
    renderWithProviders(<FinancePage />);

    await confirmRowDelete(
      invoiceRow({ id: 'invoice-4', number: 'INV-004' }),
      'Delete invoice INV-004?',
    );

    expect(gql.deleteInvoice).toHaveBeenCalledWith({ variables: { id: 'invoice-4' } });
    expect(await screen.findByText('Invoice deleted')).toBeInTheDocument();
  });
});
