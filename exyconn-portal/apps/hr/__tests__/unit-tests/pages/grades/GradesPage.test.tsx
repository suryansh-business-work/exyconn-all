import { vi } from 'vitest';
import { ListGradesPagedDocument } from '@exyconn/shell/graphql/generated';
import { GradesPage } from '../../../../src/pages/grades';
import { GRADE_COLUMNS } from '../../../../src/pages/grades/grade-grid';
import { tableStats } from '../../harness/crud-page';
import { describeCrudPage } from '../../harness/crud-page-suite';

const gql = vi.hoisted(() => ({ stats: vi.fn(), remove: vi.fn(), refetch: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListGradesStatsQuery: () => gql.stats(),
  useDeleteGradeMutation: () => [gql.remove],
}));

vi.mock('@exyconn/crud', async (importOriginal) => {
  const stub = await import('../../harness/crud-dashboard');
  return {
    ...(await importOriginal<typeof import('@exyconn/crud')>()),
    CrudDashboard: stub.CrudDashboardStub,
    usePagedFetcher: stub.usePagedFetcherStub,
  };
});

vi.mock('../../../../src/pages/grades/forms/grade', async () => ({
  GradeForm: (await import('../../harness/form-stub')).FormStub,
}));

describeCrudPage('GradesPage', {
  page: <GradesPage />,
  mocks: gql,
  statsKey: 'listGradesStats',
  stats: tableStats(7, { active: { true: 5, false: 2 } }),
  // The page repeats the total as its fourth tile.
  lines: ['Grades: 7', 'Active: 5', 'Inactive: 2', 'Grades: 7'],
  emptyLines: ['Grades: 0', 'Active: 0', 'Inactive: 0', 'Grades: 0'],
  document: ListGradesPagedDocument,
  pageKey: 'listGradesPaged',
  columns: GRADE_COLUMNS,
  meta: {
    title: 'Grades',
    exportFileName: 'grades',
    entityLabel: 'grade',
    searchPlaceholder: 'Search grades…',
  },
  row: { id: 'grade-4', name: 'Senior', code: 'G4', level: 4, active: true },
  confirm: 'Delete this grade?',
  entity: 'Grade',
});
