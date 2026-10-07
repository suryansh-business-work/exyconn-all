import { describe, expect, it, vi } from 'vitest';
import { GoalStatus, ListGoalsPagedDocument } from '@exyconn/shell/graphql/generated';
import { GoalsPage } from '../../../../src/pages/goals';
import { GOAL_COLUMNS } from '../../../../src/pages/goals/goal-grid';
import { renderWithProviders } from '../../test-utils';
import { dashboardProps } from '../../harness/crud-dashboard';
import { tableStats } from '../../harness/crud-page';
import { describeCrudPage } from '../../harness/crud-page-suite';

const gql = vi.hoisted(() => ({ stats: vi.fn(), remove: vi.fn(), refetch: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListGoalsStatsQuery: () => gql.stats(),
  useDeleteGoalMutation: () => [gql.remove],
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

vi.mock('../../../../src/pages/goals/forms/goal', async () => ({
  GoalForm: (await import('../../harness/form-stub')).FormStub,
}));

const row = {
  id: 'goal-2',
  employeeId: 'user-1',
  title: 'Ship the payroll revamp',
  kpi: 'Release date',
  weightage: 40,
  progress: 25,
  status: GoalStatus.Active,
};

describeCrudPage('GoalsPage', {
  page: <GoalsPage />,
  mocks: gql,
  statsKey: 'listGoalsStats',
  stats: tableStats(10, { status: { ACTIVE: 6, COMPLETED: 3, DRAFT: 1 } }),
  lines: ['Goals: 10', 'Active: 6', 'Completed: 3', 'Draft: 1'],
  emptyLines: ['Goals: 0', 'Active: 0', 'Completed: 0', 'Draft: 0'],
  document: ListGoalsPagedDocument,
  pageKey: 'listGoalsPaged',
  columns: GOAL_COLUMNS,
  meta: {
    title: 'Goals',
    exportFileName: 'goals',
    entityLabel: 'goal',
    searchPlaceholder: 'Search goals…',
  },
  row,
  confirm: 'Delete this goal?',
  entity: 'Goal',
});

describe('GoalsPage employee names', () => {
  it('hands the grid a lookup from employee id to name', () => {
    gql.stats.mockReturnValue({ data: undefined, loading: false, refetch: gql.refetch });
    renderWithProviders(<GoalsPage />);

    expect(dashboardProps().context.nameOf?.('user-1')).toBe('Asha Rao');
  });
});
