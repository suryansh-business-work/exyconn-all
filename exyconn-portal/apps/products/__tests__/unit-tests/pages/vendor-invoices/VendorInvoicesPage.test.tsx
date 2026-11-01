import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ListVendorInvoicesPagedDocument } from '@exyconn/shell/graphql/generated';
import { VendorInvoicesPage } from '../../../../src/pages/vendor-invoices/VendorInvoicesPage';
import { VENDOR_INVOICE_COLUMNS } from '../../../../src/pages/vendor-invoices/vendor-invoices-grid';
import { renderWithProviders } from '../../test-utils';
import { pending, tableStats } from '../../fixtures';
import { vendorInvoiceRow } from '../../vendor-fixtures';
import { dashboardProps, paged } from '../../crud-dashboard-stub';
import { runRowAction, statLines } from '../../crud-page-helpers';

const gql = vi.hoisted(() => ({
  stats: vi.fn(),
  refetch: vi.fn(),
  approve: vi.fn(),
  confirm: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListVendorInvoicesStatsQuery: () => gql.stats(),
  useApproveVendorInvoiceMutation: () => [gql.approve],
}));

vi.mock('@exyconn/shell/components/feedback/ConfirmProvider', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/components/feedback/ConfirmProvider')>()),
  useConfirm: () => gql.confirm,
}));

vi.mock('@exyconn/crud', async (importOriginal) => {
  const stub = await import('../../crud-dashboard-stub');
  return {
    ...(await importOriginal<typeof import('@exyconn/crud')>()),
    CrudDashboard: stub.CrudDashboardStub,
    usePagedFetcher: stub.usePagedFetcherStub,
  };
});

vi.mock('../../../../src/pages/vendor-invoices/forms/reject-vendor-invoice', async () => {
  const { FormStub } = await import('../../form-stub');
  return {
    RejectVendorInvoiceForm: ({
      invoice,
      ...callbacks
    }: Readonly<{ invoice: object; onCancel: () => void; onDone: () => void }>) => (
      <FormStub initial={invoice} {...callbacks} />
    ),
  };
});

describe('VendorInvoicesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.refetch.mockResolvedValue({});
    gql.confirm.mockResolvedValue(true);
    gql.approve.mockResolvedValue({ data: { approveVendorInvoice: vendorInvoiceRow() } });
    gql.stats.mockReturnValue({
      data: {
        listVendorInvoicesStats: tableStats(9, {
          status: { SUBMITTED: 4, APPROVED: 3, REJECTED: 2 },
        }),
      },
      loading: false,
      refetch: gql.refetch,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('counts the invoices by review status', () => {
    renderWithProviders(<VendorInvoicesPage />);

    expect(statLines()).toEqual(['Invoices: 9', 'To review: 4', 'Approved: 3', 'Rejected: 2']);
    expect(dashboardProps().statsLoading).toBe(false);
  });

  it('marks the tiles loading until the stats answer', () => {
    gql.stats.mockReturnValue(pending());
    renderWithProviders(<VendorInvoicesPage />);

    expect(dashboardProps().statsLoading).toBe(true);
    expect(statLines()[0]).toBe('Invoices: 0');
  });

  it('drives the server grid with the paged vendor invoices query and its columns', () => {
    renderWithProviders(<VendorInvoicesPage />);
    const page = { totalCount: 1, rows: [vendorInvoiceRow()] };

    expect(paged.document).toBe(ListVendorInvoicesPagedDocument);
    expect(paged.select?.({ listVendorInvoicesPaged: page } as never)).toBe(page);
    expect(dashboardProps()).toMatchObject({
      title: 'Vendor invoices',
      exportFileName: 'vendor-invoices',
      columnDefs: VENDOR_INVOICE_COLUMNS,
    });
    expect(dashboardProps().context.formatDate).toBeTypeOf('function');
  });

  it('opens the invoice document in a new tab', async () => {
    const open = vi.spyOn(globalThis, 'open').mockReturnValue(null);
    renderWithProviders(<VendorInvoicesPage />);

    await runRowAction('open', vendorInvoiceRow());

    expect(open).toHaveBeenCalledWith(
      'https://cdn.example.test/vendor-invoices/inv-42.pdf',
      '_blank',
      'noopener',
    );
  });

  it('approves after confirming, files the bill and refreshes the grid and the stats', async () => {
    renderWithProviders(<VendorInvoicesPage />);
    const before = dashboardProps().refreshSignal;

    await runRowAction('approve', vendorInvoiceRow({ id: 'vinv-7' }));

    expect(gql.confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Approve invoice',
        messageValues: { number: 'INV-42', supplier: 'Acme Supplies' },
        confirmText: 'Approve',
      }),
    );
    await waitFor(() => expect(gql.approve).toHaveBeenCalledWith({ variables: { id: 'vinv-7' } }));
    expect(await screen.findByText('Invoice INV-42 approved and filed as a bill')).toBeVisible();
    expect(gql.refetch).toHaveBeenCalledTimes(1);
    expect(dashboardProps().refreshSignal).toBe(Number(before) + 1);
  });

  it('does nothing when the approval is not confirmed', async () => {
    gql.confirm.mockResolvedValueOnce(false);
    renderWithProviders(<VendorInvoicesPage />);

    await runRowAction('approve', vendorInvoiceRow());

    await waitFor(() => expect(gql.confirm).toHaveBeenCalled());
    expect(gql.approve).not.toHaveBeenCalled();
  });

  it('reports an approval the server refused, without refreshing', async () => {
    gql.approve.mockRejectedValueOnce(
      new Error('Only an invoice waiting for review can be approved.'),
    );
    renderWithProviders(<VendorInvoicesPage />);

    await runRowAction('approve', vendorInvoiceRow());

    expect(
      await screen.findByText('Only an invoice waiting for review can be approved.'),
    ).toBeVisible();
    expect(gql.refetch).not.toHaveBeenCalled();
  });

  it('uses a plain message when the approval fails with something other than an Error', async () => {
    gql.approve.mockRejectedValueOnce('offline');
    renderWithProviders(<VendorInvoicesPage />);

    await runRowAction('approve', vendorInvoiceRow());

    expect(await screen.findByText('The invoice could not be approved')).toBeVisible();
  });

  it('logs a confirm dialog that failed instead of leaving it unhandled', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    gql.confirm.mockRejectedValueOnce(new Error('dialog gone'));
    renderWithProviders(<VendorInvoicesPage />);

    await runRowAction('approve', vendorInvoiceRow());

    await waitFor(() => expect(log).toHaveBeenCalledWith('Approve failed', expect.any(Error)));
    expect(gql.approve).not.toHaveBeenCalled();
  });

  it('logs a stats refresh that failed after an approval', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    gql.refetch.mockRejectedValueOnce(new Error('network'));
    renderWithProviders(<VendorInvoicesPage />);

    await runRowAction('approve', vendorInvoiceRow());

    await waitFor(() =>
      expect(log).toHaveBeenCalledWith('Vendor invoice stats', expect.any(Error)),
    );
  });

  it('opens the reject form for the row, titled by its number, and closes it on cancel', async () => {
    renderWithProviders(<VendorInvoicesPage />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await runRowAction('reject', vendorInvoiceRow({ invoiceNumber: 'INV-99' }));

    expect(await screen.findByRole('heading', { name: 'Reject INV-99' })).toBeVisible();
    expect(screen.getByText(/"invoiceNumber":"INV-99"/)).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel form' }));
    await waitFor(() => expect(screen.queryByText(/INV-99/)).not.toBeInTheDocument());
    expect(gql.refetch).not.toHaveBeenCalled();
  });

  it('closes the reject dialog from its close button', async () => {
    renderWithProviders(<VendorInvoicesPage />);
    await runRowAction('reject', vendorInvoiceRow());

    await userEvent.click(await screen.findByRole('button', { name: 'Close' }));

    await waitFor(() => expect(screen.queryByText(/"invoiceNumber"/)).not.toBeInTheDocument());
  });

  it('closes the reject form and refreshes once the rejection is sent', async () => {
    renderWithProviders(<VendorInvoicesPage />);
    const before = dashboardProps().refreshSignal;
    await runRowAction('reject', vendorInvoiceRow());

    await userEvent.click(await screen.findByRole('button', { name: 'Finish form' }));

    await waitFor(() => expect(screen.queryByText(/"invoiceNumber"/)).not.toBeInTheDocument());
    expect(gql.refetch).toHaveBeenCalledTimes(1);
    expect(dashboardProps().refreshSignal).toBe(Number(before) + 1);
  });
});
