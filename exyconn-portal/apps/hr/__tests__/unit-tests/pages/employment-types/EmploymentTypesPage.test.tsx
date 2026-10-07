import { vi } from 'vitest';
import { ListEmploymentTypesPagedDocument } from '@exyconn/shell/graphql/generated';
import { EmploymentTypesPage } from '../../../../src/pages/employment-types';
import { EMPLOYMENT_TYPE_COLUMNS } from '../../../../src/pages/employment-types/employment-type-grid';
import { tableStats } from '../../harness/crud-page';
import { describeCrudPage } from '../../harness/crud-page-suite';

const gql = vi.hoisted(() => ({ stats: vi.fn(), remove: vi.fn(), refetch: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListEmploymentTypesStatsQuery: () => gql.stats(),
  useDeleteEmploymentTypeMutation: () => [gql.remove],
}));

vi.mock('@exyconn/crud', async (importOriginal) => {
  const stub = await import('../../harness/crud-dashboard');
  return {
    ...(await importOriginal<typeof import('@exyconn/crud')>()),
    CrudDashboard: stub.CrudDashboardStub,
    usePagedFetcher: stub.usePagedFetcherStub,
  };
});

vi.mock('../../../../src/pages/employment-types/forms/employment-type', async () => ({
  EmploymentTypeForm: (await import('../../harness/form-stub')).FormStub,
}));

describeCrudPage('EmploymentTypesPage', {
  page: <EmploymentTypesPage />,
  mocks: gql,
  statsKey: 'listEmploymentTypesStats',
  stats: tableStats(4, { active: { true: 3, false: 1 } }),
  // The page repeats the total as its fourth tile.
  lines: ['Types: 4', 'Active: 3', 'Inactive: 1', 'Types: 4'],
  emptyLines: ['Types: 0', 'Active: 0', 'Inactive: 0', 'Types: 0'],
  document: ListEmploymentTypesPagedDocument,
  pageKey: 'listEmploymentTypesPaged',
  columns: EMPLOYMENT_TYPE_COLUMNS,
  meta: {
    title: 'Employment Types',
    exportFileName: 'employment-types',
    entityLabel: 'employment type',
    searchPlaceholder: 'Search types…',
  },
  row: { id: 'type-1', name: 'Full time', code: 'FT', payrollEligible: true, active: true },
  confirm: 'Delete this employment type?',
  entity: 'EmploymentType',
});
