import { describe, expect, it, vi } from 'vitest';
import { ListSalaryStructuresPagedDocument, PayType } from '@exyconn/shell/graphql/generated';
import type { TableStatsShape } from '@exyconn/shell/components/data/tableStats';
import { SalariesPage } from '../../../../src/pages/salaries';
import { SALARY_STRUCTURE_COLUMNS } from '../../../../src/pages/salaries/salary-structure-grid';
import { renderWithProviders } from '../../test-utils';
import { dashboardProps } from '../../harness/crud-dashboard';
import { describeCrudPage } from '../../harness/crud-page-suite';

const gql = vi.hoisted(() => ({ stats: vi.fn(), remove: vi.fn(), refetch: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListSalaryStructuresStatsQuery: () => gql.stats(),
  useDeleteSalaryStructureMutation: () => [gql.remove],
  useListUsersQuery: () => ({
    data: { listUsers: [{ id: 'user-1', name: 'Asha Rao', email: 'asha@example.com' }] },
  }),
}));

vi.mock('@exyconn/crud', async (importOriginal) => {
  const stub = await import('../../harness/crud-dashboard');
  return {
    ...(await importOriginal<typeof import('@exyconn/crud')>()),
    CrudDashboard: stub.CrudDashboardStub,
    usePagedFetcher: stub.usePagedFetcherStub,
  };
});

vi.mock('../../../../src/pages/salaries/forms/salary-structure', async () => ({
  SalaryStructureForm: (await import('../../harness/form-stub')).FormStub,
}));

/** The tiles add up the money columns rather than counting buckets. */
const stats: TableStatsShape = {
  total: 3,
  counts: [],
  sums: [
    { field: 'basic', total: 150000 },
    { field: 'hra', total: 60000 },
    { field: 'allowances', total: 15000 },
  ],
};

describeCrudPage('SalariesPage', {
  page: <SalariesPage />,
  mocks: gql,
  statsKey: 'listSalaryStructuresStats',
  stats,
  lines: [
    'Structures: 3',
    `Total basic: ${(150000).toLocaleString()}`,
    `Total HRA: ${(60000).toLocaleString()}`,
    `Total allowances: ${(15000).toLocaleString()}`,
  ],
  emptyLines: ['Structures: 0', 'Total basic: 0', 'Total HRA: 0', 'Total allowances: 0'],
  document: ListSalaryStructuresPagedDocument,
  pageKey: 'listSalaryStructuresPaged',
  columns: SALARY_STRUCTURE_COLUMNS,
  meta: {
    title: 'Salary Structures',
    exportFileName: 'salary-structures',
    entityLabel: 'salary structure',
    searchPlaceholder: 'Search by employee id…',
  },
  row: {
    id: 'salary-1',
    employeeId: 'user-1',
    currency: 'INR',
    payType: PayType.Fixed,
    basic: 50000,
  },
  confirm: 'Delete this salary structure?',
  // The page labels the resource with its type name, so the toast reads it that way.
  entity: 'SalaryStructure',
});

describe('SalariesPage employee names', () => {
  it('hands the grid a lookup from employee id to name', () => {
    gql.stats.mockReturnValue({ data: undefined, loading: false, refetch: gql.refetch });
    renderWithProviders(<SalariesPage />);

    expect(dashboardProps().context.nameOf?.('user-1')).toBe('Asha Rao');
    expect(dashboardProps().context.nameOf?.('user-gone')).toBe('user-gone');
  });
});
