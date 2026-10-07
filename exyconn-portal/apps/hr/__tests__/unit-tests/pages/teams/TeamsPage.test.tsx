import { vi } from 'vitest';
import { ListTeamsPagedDocument } from '@exyconn/shell/graphql/generated';
import { TeamsPage } from '../../../../src/pages/teams';
import { TEAM_COLUMNS } from '../../../../src/pages/teams/team-grid';
import { tableStats } from '../../harness/crud-page';
import { describeCrudPage } from '../../harness/crud-page-suite';

const gql = vi.hoisted(() => ({ stats: vi.fn(), remove: vi.fn(), refetch: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListTeamsStatsQuery: () => gql.stats(),
  useDeleteTeamMutation: () => [gql.remove],
}));

vi.mock('@exyconn/crud', async (importOriginal) => {
  const stub = await import('../../harness/crud-dashboard');
  return {
    ...(await importOriginal<typeof import('@exyconn/crud')>()),
    CrudDashboard: stub.CrudDashboardStub,
    usePagedFetcher: stub.usePagedFetcherStub,
  };
});

vi.mock('../../../../src/pages/teams/forms/team', async () => ({
  TeamForm: (await import('../../harness/form-stub')).FormStub,
}));

describeCrudPage('TeamsPage', {
  page: <TeamsPage />,
  mocks: gql,
  statsKey: 'listTeamsStats',
  stats: tableStats(8, { active: { true: 6, false: 2 } }),
  // The page repeats the total as its fourth tile.
  lines: ['Teams: 8', 'Active: 6', 'Inactive: 2', 'Teams: 8'],
  emptyLines: ['Teams: 0', 'Active: 0', 'Inactive: 0', 'Teams: 0'],
  document: ListTeamsPagedDocument,
  pageKey: 'listTeamsPaged',
  columns: TEAM_COLUMNS,
  meta: {
    title: 'Teams',
    exportFileName: 'teams',
    entityLabel: 'team',
    searchPlaceholder: 'Search teams…',
  },
  row: {
    id: 'team-3',
    name: 'Platform',
    department: 'Engineering',
    leadEmployeeId: 'user-1',
    description: 'Runs the shared services',
    active: true,
  },
  confirm: 'Delete this team?',
  entity: 'Team',
});
