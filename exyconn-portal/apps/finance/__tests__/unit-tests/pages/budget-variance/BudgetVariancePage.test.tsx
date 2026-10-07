import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { formatMoney } from '@exyconn/shell/utils/money';
import { BudgetVariancePage } from '../../../../src/pages/budget-variance';
import { renderWithProviders } from '../../test-utils';

const gql = vi.hoisted(() => ({ result: vi.fn(), refetch: vi.fn(), options: [] as unknown[] }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useBudgetVsActualQuery: (options: unknown) => {
    gql.options.push(options);
    return gql.result();
  },
}));

const ROWS = [
  {
    costCenterId: 'centre-1',
    code: 'ENG',
    name: 'Engineering',
    budgeted: 1000,
    actual: 600,
    variance: 400,
    utilisation: 60,
  },
  {
    costCenterId: 'centre-2',
    code: 'MKT',
    name: 'Marketing',
    budgeted: 500,
    actual: 700,
    variance: -200,
    utilisation: 140,
  },
  { costCenterId: '', code: '—', name: 'Unallocated', budgeted: 0, actual: 300, variance: -300 },
];

function rowCells(name: string): string[] {
  const row = screen.getByText(name).closest('tr') as HTMLElement;
  return within(row)
    .getAllByRole('cell')
    .map((cell) => cell.textContent ?? '');
}

describe('BudgetVariancePage', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-09-04T10:30:00.000Z'));
    vi.clearAllMocks();
    gql.options.length = 0;
    gql.refetch.mockResolvedValue({});
    gql.result.mockReturnValue({
      data: { budgetVsActual: ROWS },
      loading: false,
      refetch: gql.refetch,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('compares the last three months, read fresh each time', () => {
    renderWithProviders(<BudgetVariancePage />);

    expect(gql.options[0]).toEqual({
      variables: { from: '2026-07-01T00:00:00.000Z', to: '2026-09-04T23:59:59.999Z' },
      fetchPolicy: 'cache-and-network',
    });
  });

  it('says how much was spent of how much was budgeted, over the period', () => {
    renderWithProviders(<BudgetVariancePage />);

    expect(
      screen.getByText(
        `Last 3 months — ${formatMoney(1600)} spent of ${formatMoney(1500)} budgeted`,
      ),
    ).toBeInTheDocument();
  });

  it('lists each centre with its budget, spend, what is left and how much is used', () => {
    renderWithProviders(<BudgetVariancePage />);

    expect(rowCells('Engineering')).toEqual([
      'EngineeringENG',
      formatMoney(1000),
      formatMoney(600),
      formatMoney(400),
      '60% used',
    ]);
  });

  it('calls out an overspend, and keeps spend booked to no centre as its own row', () => {
    renderWithProviders(<BudgetVariancePage />);

    expect(rowCells('Marketing')[3]).toBe(`${formatMoney(200)} over`);
    expect(rowCells('Unallocated')).toEqual([
      'Unallocated—',
      formatMoney(0),
      formatMoney(300),
      `${formatMoney(300)} over`,
      'No budget set',
    ]);
  });

  it('re-asks for the period somebody picks', async () => {
    renderWithProviders(<BudgetVariancePage />);

    await userEvent.click(screen.getByRole('combobox', { name: /Period/ }));
    await userEvent.click(screen.getByRole('option', { name: 'This month' }));

    expect(gql.options.at(-1)).toMatchObject({
      variables: { from: '2026-09-01T00:00:00.000Z', to: '2026-09-04T23:59:59.999Z' },
    });
    expect(screen.getByText(/^This month — /)).toBeInTheDocument();
  });

  it('says so when no budget is set and nothing was spent', () => {
    gql.result.mockReturnValue({ data: undefined, loading: false, refetch: gql.refetch });
    renderWithProviders(<BudgetVariancePage />);

    expect(
      screen.getByText('No budgets set and no spend booked in this period.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(`Last 3 months — ${formatMoney(0)} spent of ${formatMoney(0)} budgeted`),
    ).toBeInTheDocument();
  });

  it('re-runs the comparison from the refresh button', async () => {
    renderWithProviders(<BudgetVariancePage />);

    await userEvent.click(screen.getByRole('button', { name: 'Refresh table' }));

    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });
});
