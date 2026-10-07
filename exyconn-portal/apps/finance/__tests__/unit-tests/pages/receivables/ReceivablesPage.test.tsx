import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReceivablesPage } from '../../../../src/pages/receivables';
import { renderWithProviders } from '../../test-utils';

const gql = vi.hoisted(() => ({ result: vi.fn(), refetch: vi.fn(), options: null as unknown }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useReceivablesQuery: (options: unknown) => {
    gql.options = options;
    return gql.result();
  },
}));

const REPORT = {
  outstanding: 800,
  overdue: 300,
  invoices: 4,
  buckets: [
    { band: 'CURRENT', label: 'Not yet due', invoices: 2, amount: 500 },
    { band: 'D1_30', label: '1–30 days', invoices: 1, amount: 200 },
    { band: 'D60_PLUS', label: '60+ days', invoices: 1, amount: 100.4 },
  ],
};

function cells(rowName: string): string[] {
  const row = screen.getByRole('cell', { name: rowName }).closest('tr') as HTMLElement;
  return within(row)
    .getAllByRole('cell')
    .map((cell) => cell.textContent ?? '');
}

describe('ReceivablesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.refetch.mockResolvedValue({});
    gql.result.mockReturnValue({
      data: { receivables: REPORT },
      loading: false,
      refetch: gql.refetch,
    });
  });

  it('always works lateness out afresh rather than from a cache', () => {
    renderWithProviders(<ReceivablesPage />);

    expect(gql.options).toEqual({ fetchPolicy: 'cache-and-network' });
    expect(screen.getByRole('heading', { name: 'Receivables' })).toBeInTheDocument();
  });

  it('totals what is owed, what is late, what is not yet due and how many invoices', () => {
    renderWithProviders(<ReceivablesPage />);

    expect(screen.getByText('₹800')).toBeInTheDocument();
    expect(screen.getByText('₹300')).toBeInTheDocument();
    // Not yet due: the tile and the CURRENT band both read 800 - 300.
    expect(screen.getAllByText('₹500')).toHaveLength(2);
    expect(screen.getByText('Open invoices')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('lists each age band with its invoices, amount and share of the total', () => {
    renderWithProviders(<ReceivablesPage />);

    expect(cells('1–30 days')).toEqual(['1–30 days', '1', '₹200', '25%']);
    expect(cells('60+ days')).toEqual(['60+ days', '1', '₹100', '13%']);
  });

  it('marks only the late bands, leaving money not yet due plain', () => {
    renderWithProviders(<ReceivablesPage />);

    expect(
      screen.getByRole('cell', { name: '1–30 days' }).querySelector('.MuiChip-root'),
    ).not.toBeNull();
    expect(
      screen.getByRole('cell', { name: '60+ days' }).querySelector('.MuiChip-root'),
    ).not.toBeNull();
    expect(
      screen.getByRole('cell', { name: 'Not yet due' }).querySelector('.MuiChip-root'),
    ).toBeNull();
    expect(cells('Not yet due')).toEqual(['Not yet due', '2', '₹500', '63%']);
  });

  it('says nothing is outstanding when there are no bands, with zero totals', () => {
    gql.result.mockReturnValue({ data: undefined, loading: false, refetch: gql.refetch });
    renderWithProviders(<ReceivablesPage />);

    expect(screen.getByText('Nothing is outstanding.')).toBeInTheDocument();
    expect(screen.getAllByText('₹0')).toHaveLength(3);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('shows a dash for the share when nothing is owed in total', () => {
    gql.result.mockReturnValue({
      data: {
        receivables: {
          outstanding: 0,
          overdue: 0,
          invoices: 0,
          buckets: [{ band: 'CURRENT', label: 'Current', invoices: 0, amount: 0 }],
        },
      },
      loading: false,
      refetch: gql.refetch,
    });
    renderWithProviders(<ReceivablesPage />);

    expect(cells('Current')).toEqual(['Current', '0', '₹0', '—']);
  });

  it('re-runs the report from the refresh button', async () => {
    renderWithProviders(<ReceivablesPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Refresh table' }));

    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });
});
