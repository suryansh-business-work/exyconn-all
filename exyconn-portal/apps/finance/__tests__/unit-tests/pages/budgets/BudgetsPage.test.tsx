import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ListBudgetsPagedDocument } from '@exyconn/shell/graphql/generated';
import { formatMoney } from '@exyconn/shell/utils/money';
import { BudgetsPage } from '../../../../src/pages/budgets';
import { renderWithProviders } from '../../test-utils';
import { budgetRow, costCenterRow, pending, tableStats } from '../../fixtures';
import { dashboardProps, paged } from '../../crud-dashboard-stub';
import { confirmRowDelete, runRowAction, statLines } from '../../crud-page-helpers';
import { formatCell } from '../../grid-helpers';

const gql = vi.hoisted(() => ({
  stats: vi.fn(),
  refetch: vi.fn(),
  centres: vi.fn(),
  deleteBudget: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListBudgetsStatsQuery: () => gql.stats(),
  useListCostCentersQuery: () => gql.centres(),
  useDeleteBudgetMutation: () => [gql.deleteBudget],
}));

vi.mock('@exyconn/crud', async (importOriginal) => {
  const stub = await import('../../crud-dashboard-stub');
  return {
    ...(await importOriginal<typeof import('@exyconn/crud')>()),
    CrudDashboard: stub.CrudDashboardStub,
    usePagedFetcher: stub.usePagedFetcherStub,
  };
});

vi.mock('../../../../src/pages/budgets/forms/budget', async () => ({
  BudgetForm: (await import('../../form-stub')).FormStub,
}));

const CENTRES = [
  costCenterRow({ id: 'centre-1', code: 'ENG', name: 'Engineering' }),
  costCenterRow({ id: 'centre-2', code: 'OLD', name: 'Retired team', isActive: false }),
];

const centreCell = (costCenterId: string) =>
  formatCell(dashboardProps().columnDefs, 'costCentre', budgetRow({ costCenterId }));

describe('BudgetsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.refetch.mockResolvedValue({});
    gql.deleteBudget.mockResolvedValue({ data: { deleteBudget: true } });
    gql.centres.mockReturnValue({ data: { listCostCenters: CENTRES } });
    gql.stats.mockReturnValue({
      data: { listBudgetsStats: tableStats(3, {}, { amount: 900 }) },
      loading: false,
      refetch: gql.refetch,
    });
  });

  it('counts the budgets, what they add up to, and the centres that can take one', () => {
    renderWithProviders(<BudgetsPage />);

    expect(statLines()).toEqual([
      'Budgets: 3',
      `Total budgeted: ${formatMoney(900)}`,
      'Cost centres: 1',
    ]);
    expect(dashboardProps().statsLoading).toBe(false);
  });

  it('marks the tiles loading until the stats answer', () => {
    gql.stats.mockReturnValue(pending());
    renderWithProviders(<BudgetsPage />);

    expect(dashboardProps().statsLoading).toBe(true);
    expect(statLines()[0]).toBe('Budgets: 0');
  });

  it('drives the server grid with the paged budgets query', () => {
    renderWithProviders(<BudgetsPage />);
    const page = { totalCount: 1, rows: [budgetRow()] };

    expect(paged.document).toBe(ListBudgetsPagedDocument);
    expect(paged.select?.({ listBudgetsPaged: page } as never)).toBe(page);
    expect(dashboardProps()).toMatchObject({
      title: 'Budgets',
      exportFileName: 'budgets',
      permissionModule: 'Budget',
    });
  });

  it('names each budget’s centre, retired ones included, and dashes an unknown one', () => {
    renderWithProviders(<BudgetsPage />);

    expect(centreCell('centre-1')).toBe('ENG');
    expect(centreCell('centre-2')).toBe('OLD');
    expect(centreCell('centre-gone')).toBe('—');
  });

  it('hands the form only the active centres to budget against', async () => {
    renderWithProviders(<BudgetsPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Open new form' }));

    expect(screen.getByText('Blank form')).toBeInTheDocument();
    expect(
      screen.getByText('Centres [{"value":"centre-1","label":"ENG — Engineering"}]'),
    ).toBeInTheDocument();
  });

  it('opens a budget to edit and reloads once it is saved', async () => {
    renderWithProviders(<BudgetsPage />);

    await runRowAction('edit', budgetRow({ month: '2026-11' }));
    expect(screen.getByText(/"month":"2026-11"/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));

    expect(screen.queryByText(/2026-11/)).not.toBeInTheDocument();
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('deletes a budget after confirming, naming its month and centre', async () => {
    renderWithProviders(<BudgetsPage />);

    await confirmRowDelete(budgetRow({ id: 'budget-4' }), 'Delete the 2026-09 budget for ENG?');

    expect(gql.deleteBudget).toHaveBeenCalledWith({ variables: { id: 'budget-4' } });
    expect(await screen.findByText('Budget deleted')).toBeInTheDocument();
  });

  it('works before the centres load: no centres to offer and no names to show', () => {
    gql.centres.mockReturnValue({ data: undefined });
    renderWithProviders(<BudgetsPage />);

    expect(statLines()[2]).toBe('Cost centres: 0');
    expect(centreCell('centre-1')).toBe('—');
  });
});
