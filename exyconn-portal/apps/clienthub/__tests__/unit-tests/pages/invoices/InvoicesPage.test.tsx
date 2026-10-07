import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InvoiceStatus } from '@exyconn/shell/graphql/generated';
import { InvoicesPage } from '../../../../src/pages/invoices/InvoicesPage';
import { INVOICE_COLUMNS } from '../../../../src/pages/invoices/invoices-grid';
import { dashboardProps, TABLE_INPUT } from '../../crud-dashboard-stub';
import { renderWithProviders, useCurrentUrl } from '../../test-utils';

const DAY = 24 * 60 * 60 * 1000;

const gql = vi.hoisted(() => ({
  useClientHubRemindersQuery: vi.fn(),
  useClientHubPaymentOptionsQuery: vi.fn(),
  useClientHubPayInvoiceMutation: vi.fn(),
}));
const crud = vi.hoisted(() => ({
  select: null as null | ((data: unknown) => unknown),
  fetchRows: vi.fn(),
}));
const invoiceActions = vi.hoisted(() => ({ download: vi.fn(), email: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  ...gql,
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
vi.mock('../../../../src/pages/invoices/useInvoiceActions', () => ({
  useInvoiceActions: () => invoiceActions,
}));

const reminder = (invoiceId: string, daysLate: number, dueInDays: number) => ({
  invoiceId,
  number: invoiceId.toUpperCase(),
  currency: 'USD',
  balance: 150,
  dueDate: new Date(Date.now() + dueInDays * DAY).toISOString(),
  daysLate,
  status: InvoiceStatus.Sent,
});
const OWED = [reminder('inv-1', 3, -3), reminder('inv-2', 0, 2), reminder('inv-3', 0, 30)];
const ROW = {
  id: 'inv-9',
  number: 'INV-9',
  amount: 500,
  amountPaid: 200,
  currency: 'USD',
  status: InvoiceStatus.PartiallyPaid,
  issuedDate: '2026-09-01T00:00:00.000Z',
  dueDate: '2026-10-01T00:00:00.000Z',
};

function Url() {
  return <p data-testid="url">{useCurrentUrl()}</p>;
}

function renderPage(route = '/invoices') {
  renderWithProviders(
    <>
      <InvoicesPage />
      <Url />
    </>,
    { route },
  );
}

const statValues = () => dashboardProps().stats.map((stat) => [stat.label, stat.value]);

describe('InvoicesPage', () => {
  beforeEach(() => {
    gql.useClientHubRemindersQuery.mockReturnValue({
      data: { clientHubReminders: OWED },
      loading: false,
    });
    gql.useClientHubPaymentOptionsQuery.mockReturnValue({ data: undefined, loading: true });
    gql.useClientHubPayInvoiceMutation.mockReturnValue([vi.fn(), {}]);
  });
  afterEach(() => vi.clearAllMocks());

  it('hands the dashboard the invoice columns, CSV name and server-paged rows', async () => {
    renderPage();
    const props = dashboardProps();
    expect(props.title).toBe('Invoices');
    expect(props.entityLabel).toBe('invoice');
    expect(props.exportFileName).toBe('invoices');
    expect(props.columnDefs).toBe(INVOICE_COLUMNS);
    expect(props.context.formatDate('2026-10-14T00:00:00.000Z')).toBe('14 Oct 2026');

    crud.fetchRows.mockResolvedValue({ rows: [ROW], totalCount: 1 });
    await expect(props.fetchRows(TABLE_INPUT)).resolves.toEqual({ rows: [ROW], totalCount: 1 });
    const page = { rows: [ROW], totalCount: 1 };
    expect(crud.select?.({ clientHubInvoices: page })).toBe(page);
  });

  it('counts unpaid, overdue and due-this-week invoices from the reminders', () => {
    renderPage();
    expect(statValues()).toEqual([
      ['Unpaid', '3'],
      ['Overdue', '1'],
      ['Due this week', '1'],
    ]);
    expect(dashboardProps().statsLoading).toBe(false);
  });

  it('shows the stats loading, at zero, until the reminders first arrive', () => {
    gql.useClientHubRemindersQuery.mockReturnValue({ data: undefined, loading: true });
    renderPage();
    expect(dashboardProps().statsLoading).toBe(true);
    expect(statValues()).toEqual([
      ['Unpaid', '0'],
      ['Overdue', '0'],
      ['Due this week', '0'],
    ]);
  });

  it('opens a row for payment at its outstanding balance, and closes it', async () => {
    renderPage();
    act(() => dashboardProps().context.actions.pay(ROW as never));
    expect(await screen.findByText('Pay invoice INV-9')).toBeInTheDocument();
    expect(screen.getByText('Amount due: $300.00')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByText('Amount due: $300.00')).not.toBeInTheDocument();
  });

  it('downloads or emails an invoice through the invoice actions', () => {
    renderPage();
    const { actions } = dashboardProps().context;
    expect(actions.download).toBe(invoiceActions.download);
    expect(actions.email).toBe(invoiceActions.email);
  });

  it('opens an emailed "Pay now" link once the invoice is known to be owed, then tidies the URL', async () => {
    renderPage('/invoices?pay=inv-2');
    expect(await screen.findByText('Pay invoice INV-2')).toBeInTheDocument();
    expect(screen.getByText('Amount due: $150.00')).toBeInTheDocument();
    expect(screen.getByTestId('url')).toHaveTextContent(/^\/invoices$/);
  });

  it('ignores a "Pay now" link for an invoice that is not owed', () => {
    renderPage('/invoices?pay=inv-404');
    expect(screen.queryByText(/Pay invoice/)).not.toBeInTheDocument();
    expect(screen.getByTestId('url')).toHaveTextContent('/invoices?pay=inv-404');
  });
});
