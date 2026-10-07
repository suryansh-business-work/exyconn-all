import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ListRecurringInvoicesPagedDocument } from '@exyconn/shell/graphql/generated';
import { RecurringInvoicesPage } from '../../../../src/pages/finance';
import { RECURRING_INVOICE_COLUMNS } from '../../../../src/pages/finance/recurring-invoices-grid';
import { renderWithProviders } from '../../test-utils';
import { recurringRow } from '../../fixtures';
import { dashboardProps, paged } from '../../crud-dashboard-stub';
import { confirmRowDelete, runRowAction } from '../../crud-page-helpers';

const gql = vi.hoisted(() => ({ deleteRecurring: vi.fn(), runNow: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useDeleteRecurringInvoiceMutation: () => [gql.deleteRecurring],
  useRunRecurringInvoiceNowMutation: () => [gql.runNow],
}));

vi.mock('@exyconn/crud', async (importOriginal) => {
  const stub = await import('../../crud-dashboard-stub');
  return {
    ...(await importOriginal<typeof import('@exyconn/crud')>()),
    CrudDashboard: stub.CrudDashboardStub,
    usePagedFetcher: stub.usePagedFetcherStub,
  };
});

vi.mock('../../../../src/pages/finance/forms/recurring-invoice', async () => ({
  RecurringInvoiceForm: (await import('../../form-stub')).FormStub,
}));

describe('RecurringInvoicesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.deleteRecurring.mockResolvedValue({ data: { deleteRecurringInvoice: true } });
    gql.runNow.mockResolvedValue({ data: { runRecurringInvoiceNow: { id: 'invoice-1' } } });
  });

  it('drives the server grid with the paged retainers query and shows no stat tiles', () => {
    renderWithProviders(<RecurringInvoicesPage />);
    const page = { totalCount: 1, rows: [recurringRow()] };

    expect(paged.document).toBe(ListRecurringInvoicesPagedDocument);
    expect(paged.select?.({ listRecurringInvoicesPaged: page } as never)).toBe(page);
    expect(dashboardProps()).toMatchObject({
      title: 'Recurring invoices',
      exportFileName: 'recurring-invoices',
      permissionModule: 'RecurringInvoice',
      columnDefs: RECURRING_INVOICE_COLUMNS,
      stats: [],
    });
    expect(dashboardProps().context.formatDate).toEqual(expect.any(Function));
  });

  it('raises a draft invoice now and says so', async () => {
    renderWithProviders(<RecurringInvoicesPage />);

    await runRowAction('runNow', recurringRow({ id: 'recurring-3', name: 'Acme support' }));

    expect(gql.runNow).toHaveBeenCalledWith({ variables: { id: 'recurring-3' } });
    expect(
      await screen.findByText('A draft invoice was raised for "Acme support".'),
    ).toBeInTheDocument();
  });

  it('says why an invoice could not be raised', async () => {
    gql.runNow.mockRejectedValueOnce(new Error('The retainer has ended'));
    renderWithProviders(<RecurringInvoicesPage />);

    await runRowAction('runNow', recurringRow());

    expect(await screen.findByText('The retainer has ended')).toBeInTheDocument();
  });

  it('falls back to a generic message for a failure that is not an Error', async () => {
    gql.runNow.mockRejectedValueOnce('offline');
    renderWithProviders(<RecurringInvoicesPage />);

    await runRowAction('runNow', recurringRow());

    await waitFor(() => {
      expect(screen.getByText('Could not raise the invoice')).toBeInTheDocument();
    });
  });

  it('opens the form blank for a new retainer and with the row for an edit', async () => {
    renderWithProviders(<RecurringInvoicesPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Open new form' }));
    expect(screen.getByText('Blank form')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel form' }));

    await runRowAction('edit', recurringRow({ name: 'Globex hosting' }));
    expect(screen.getByText(/"name":"Globex hosting"/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));
    expect(screen.queryByText(/Globex hosting/)).not.toBeInTheDocument();
  });

  it('deletes a retainer after confirming, saying its invoices are kept', async () => {
    renderWithProviders(<RecurringInvoicesPage />);

    await confirmRowDelete(
      recurringRow({ id: 'recurring-5', name: 'Nimbus retainer' }),
      'Delete "Nimbus retainer"? Invoices it has already raised are not affected.',
    );

    expect(gql.deleteRecurring).toHaveBeenCalledWith({ variables: { id: 'recurring-5' } });
    expect(await screen.findByText('Recurring invoice deleted')).toBeInTheDocument();
  });
});
