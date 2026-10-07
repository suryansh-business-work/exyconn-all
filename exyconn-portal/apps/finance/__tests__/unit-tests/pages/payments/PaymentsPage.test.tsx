import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ListPaymentsPagedDocument } from '@exyconn/shell/graphql/generated';
import { PaymentsPage } from '../../../../src/pages/payments';
import { PAYMENT_COLUMNS } from '../../../../src/pages/payments/payments-grid';
import { renderWithProviders } from '../../test-utils';
import { paymentRow } from '../../fixtures';
import { paged } from '../../crud-dashboard-stub';

interface GridProps {
  columnDefs: unknown;
  fetchRows: unknown;
  refreshSignal: number;
  onQuery: unknown;
  searchPlaceholder: string;
}

interface ExportProps {
  fileName: string;
  columnDefs: unknown;
  fetchRows: unknown;
  getQuery: unknown;
}

const seen = vi.hoisted(() => ({
  grid: null as GridProps | null,
  exported: null as ExportProps | null,
  tracker: { onQuery: () => undefined, getQuery: () => ({}) },
}));

vi.mock('@exyconn/shell/components/data/ServerDataGrid', () => ({
  ServerDataGrid: (props: Readonly<GridProps>) => {
    seen.grid = props;
    return <output aria-label="refresh signal">{props.refreshSignal}</output>;
  },
}));

vi.mock('@exyconn/crud', async (importOriginal) => {
  const stub = await import('../../crud-dashboard-stub');
  return {
    ...(await importOriginal<typeof import('@exyconn/crud')>()),
    usePagedFetcher: stub.usePagedFetcherStub,
    useGridQuery: () => seen.tracker,
    GridExportButton: (props: Readonly<ExportProps>) => {
      seen.exported = props;
      return null;
    },
  };
});

vi.mock('../../../../src/pages/payments/forms/payment', async () => ({
  PaymentForm: (await import('../../form-stub')).FormStub,
}));

const signal = () => screen.getByRole('status', { name: 'refresh signal' }).textContent;

describe('PaymentsPage', () => {
  beforeEach(() => {
    seen.grid = null;
    seen.exported = null;
  });

  it('lists every receipt in the server grid, exportable with the same columns', () => {
    renderWithProviders(<PaymentsPage />);
    const page = { totalCount: 1, rows: [paymentRow()] };

    expect(screen.getByRole('heading', { name: 'Payments' })).toBeInTheDocument();
    expect(paged.document).toBe(ListPaymentsPagedDocument);
    expect(paged.select?.({ listPaymentsPaged: page } as never)).toBe(page);
    expect(seen.grid).toMatchObject({
      columnDefs: PAYMENT_COLUMNS,
      fetchRows: paged.fetchRows,
      refreshSignal: 0,
      onQuery: seen.tracker.onQuery,
      searchPlaceholder: 'Search by invoice, client or reference…',
    });
    expect(seen.exported).toMatchObject({
      fileName: 'payments',
      columnDefs: PAYMENT_COLUMNS,
      fetchRows: paged.fetchRows,
      getQuery: seen.tracker.getQuery,
    });
  });

  it('opens the record form in place of the list, and goes back from either button', async () => {
    renderWithProviders(<PaymentsPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Record payment' }));
    expect(screen.getByRole('heading', { name: 'Record payment' })).toBeInTheDocument();
    expect(screen.getByText('Blank form')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Back to Payments' }));
    expect(screen.getByRole('heading', { name: 'Payments' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Record payment' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel form' }));
    expect(screen.queryByText('Blank form')).not.toBeInTheDocument();
    expect(signal()).toBe('0');
  });

  it('returns to a refreshed list once a payment is recorded', async () => {
    renderWithProviders(<PaymentsPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Record payment' }));
    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));

    expect(screen.getByRole('heading', { name: 'Payments' })).toBeInTheDocument();
    expect(signal()).toBe('1');
  });
});
