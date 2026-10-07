import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ListCostCentersPagedDocument } from '@exyconn/shell/graphql/generated';
import { CostCentersPage } from '../../../../src/pages/cost-centers';
import { COST_CENTER_COLUMNS } from '../../../../src/pages/cost-centers/cost-centers-grid';
import { renderWithProviders } from '../../test-utils';
import { costCenterRow, pending, tableStats } from '../../fixtures';
import { dashboardProps, paged } from '../../crud-dashboard-stub';
import { confirmRowDelete, runRowAction, statLines } from '../../crud-page-helpers';
import { actionSpecs, columnIds } from '../../grid-helpers';

const gql = vi.hoisted(() => ({ stats: vi.fn(), refetch: vi.fn(), deleteCentre: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListCostCentersStatsQuery: () => gql.stats(),
  useDeleteCostCenterMutation: () => [gql.deleteCentre],
}));

vi.mock('@exyconn/crud', async (importOriginal) => {
  const stub = await import('../../crud-dashboard-stub');
  return {
    ...(await importOriginal<typeof import('@exyconn/crud')>()),
    CrudDashboard: stub.CrudDashboardStub,
    usePagedFetcher: stub.usePagedFetcherStub,
  };
});

vi.mock('../../../../src/pages/cost-centers/forms/cost-center', async () => ({
  CostCenterForm: (await import('../../form-stub')).FormStub,
}));

describe('CostCentersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.refetch.mockResolvedValue({});
    gql.deleteCentre.mockResolvedValue({ data: { deleteCostCenter: true } });
    gql.stats.mockReturnValue({
      data: { listCostCentersStats: tableStats(5, { isActive: { true: 4, false: 1 } }) },
      loading: false,
      refetch: gql.refetch,
    });
  });

  it('counts the centres, the active ones and the retired ones', () => {
    renderWithProviders(<CostCentersPage />);

    expect(statLines()).toEqual(['Centres: 5', 'Active: 4', 'Retired: 1']);
    expect(dashboardProps().statsLoading).toBe(false);
  });

  it('marks the tiles loading until the stats answer', () => {
    gql.stats.mockReturnValue(pending());
    renderWithProviders(<CostCentersPage />);

    expect(dashboardProps().statsLoading).toBe(true);
    expect(statLines()).toEqual(['Centres: 0', 'Active: 0', 'Retired: 0']);
  });

  it('drives the server grid with the paged centres query and the register columns', () => {
    renderWithProviders(<CostCentersPage />);
    const page = { totalCount: 1, rows: [costCenterRow()] };

    expect(paged.document).toBe(ListCostCentersPagedDocument);
    expect(paged.select?.({ listCostCentersPaged: page } as never)).toBe(page);
    expect(dashboardProps()).toMatchObject({
      title: 'Cost centres',
      exportFileName: 'cost-centres',
      permissionModule: 'CostCenter',
      columnDefs: COST_CENTER_COLUMNS,
    });
  });

  it('lists code, name, description and the active flag, with edit and delete', () => {
    expect(columnIds(COST_CENTER_COLUMNS)).toEqual([
      'code',
      'name',
      'description',
      'isActive',
      'actions',
    ]);
    expect(actionSpecs(COST_CENTER_COLUMNS).map((spec) => spec.key)).toEqual(['edit', 'delete']);
  });

  it('opens the form blank for a new centre and with the row for an edit', async () => {
    renderWithProviders(<CostCentersPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Open new form' }));
    expect(screen.getByText('Blank form')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel form' }));

    await runRowAction('edit', costCenterRow({ code: 'MKT' }));
    expect(screen.getByText(/"code":"MKT"/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));
    expect(screen.queryByText(/MKT/)).not.toBeInTheDocument();
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('warns that deleting orphans the history, then deletes on confirmation', async () => {
    renderWithProviders(<CostCentersPage />);

    await confirmRowDelete(
      costCenterRow({ id: 'centre-6', code: 'OPS' }),
      'Delete OPS? Spend and budgets already booked to it will no longer have a centre. Retiring it instead keeps the history readable.',
    );

    expect(gql.deleteCentre).toHaveBeenCalledWith({ variables: { id: 'centre-6' } });
    expect(await screen.findByText('Cost centre deleted')).toBeInTheDocument();
  });
});
