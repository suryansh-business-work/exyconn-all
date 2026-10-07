import { describe, expect, it, vi } from 'vitest';
import type { ColDef } from 'ag-grid-community';
import { PaymentMethod } from '@exyconn/shell/graphql/generated';
import { TransactionsPage } from '../../../../src/pages/payments/TransactionsPage';
import {
  PAYMENT_COLUMNS,
  type ClientPaymentRow,
} from '../../../../src/pages/payments/payments-grid';
import { dashboardProps, TABLE_INPUT } from '../../crud-dashboard-stub';
import { renderWithProviders } from '../../test-utils';

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

type Formatter = (params: { data?: ClientPaymentRow; context: unknown }) => string;

const REFUND: ClientPaymentRow = {
  id: 'pay-2',
  invoiceNumber: 'INV-3',
  amount: -45.5,
  currency: 'GBP',
  method: PaymentMethod.BankTransfer,
  reference: 'RF-118',
  receivedAt: '2026-09-30T10:00:00.000Z',
};

const amountCell = (row: ClientPaymentRow) => {
  const col = PAYMENT_COLUMNS.find((c: ColDef<ClientPaymentRow>) => c.field === 'amount');
  return (col?.valueFormatter as Formatter)({ data: row, context: { t: (text: string) => text } });
};

describe('TransactionsPage', () => {
  it('lists every payment received as an exportable, server-paged table without stats', async () => {
    renderWithProviders(<TransactionsPage />);
    const props = dashboardProps();
    expect(props.title).toBe('Transactions');
    expect(props.entityLabel).toBe('transaction');
    expect(props.exportFileName).toBe('transactions');
    expect(props.stats).toEqual([]);
    expect(props.columnDefs).toBe(PAYMENT_COLUMNS);
    expect(props.context.actions).toEqual({});
    expect(props.context.formatDate('2026-10-02T10:00:00.000Z')).toBe('02 Oct 2026');

    const page = { rows: [REFUND], totalCount: 1 };
    crud.fetchRows.mockResolvedValue(page);
    await expect(props.fetchRows(TABLE_INPUT)).resolves.toBe(page);
    expect(crud.select?.({ clientHubPayments: page })).toBe(page);
  });
});

describe('PAYMENT_COLUMNS', () => {
  it('shows date, invoice, amount, method and reference', () => {
    expect(PAYMENT_COLUMNS.map((col) => col.field)).toEqual([
      'receivedAt',
      'invoiceNumber',
      'amount',
      'method',
      'reference',
    ]);
  });

  it('writes each amount in its own currency, a refund as negative', () => {
    expect(amountCell({ ...REFUND, amount: 1200, currency: 'USD' })).toBe('$1,200.00');
    expect(amountCell(REFUND)).toBe('-£45.50');
  });
});
