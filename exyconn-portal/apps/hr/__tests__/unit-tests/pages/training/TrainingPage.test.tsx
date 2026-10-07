import { describe, expect, it, vi } from 'vitest';
import { ListTrainingsPagedDocument, TrainingStatus } from '@exyconn/shell/graphql/generated';
import { TrainingPage } from '../../../../src/pages/training';
import { TRAINING_COLUMNS } from '../../../../src/pages/training/training-grid';
import { renderWithProviders } from '../../test-utils';
import { dashboardProps } from '../../harness/crud-dashboard';
import { tableStats } from '../../harness/crud-page';
import { describeCrudPage } from '../../harness/crud-page-suite';

const gql = vi.hoisted(() => ({ stats: vi.fn(), remove: vi.fn(), refetch: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListTrainingsStatsQuery: () => gql.stats(),
  useDeleteTrainingMutation: () => [gql.remove],
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

vi.mock('../../../../src/pages/training/forms/training', async () => ({
  TrainingForm: (await import('../../harness/form-stub')).FormStub,
}));

describeCrudPage('TrainingPage', {
  page: <TrainingPage />,
  mocks: gql,
  statsKey: 'listTrainingsStats',
  stats: tableStats(6, { status: { IN_PROGRESS: 2, COMPLETED: 3, ASSIGNED: 1 } }),
  lines: ['Assigned: 6', 'In progress: 2', 'Completed: 3', 'Not started: 1'],
  emptyLines: ['Assigned: 0', 'In progress: 0', 'Completed: 0', 'Not started: 0'],
  document: ListTrainingsPagedDocument,
  pageKey: 'listTrainingsPaged',
  columns: TRAINING_COLUMNS,
  meta: {
    title: 'Learning & Training',
    exportFileName: 'training',
    entityLabel: 'training',
    searchPlaceholder: 'Search training…',
  },
  row: {
    id: 'training-2',
    employeeId: 'user-1',
    title: 'First aid',
    provider: 'Red Cross',
    category: 'Safety',
    assignedOn: '2026-09-01T00:00:00.000Z',
    status: TrainingStatus.InProgress,
  },
  confirm: 'Delete this training?',
  entity: 'Training',
});

describe('TrainingPage employee names', () => {
  it('hands the grid a lookup from employee id to name', () => {
    gql.stats.mockReturnValue({ data: undefined, loading: false, refetch: gql.refetch });
    renderWithProviders(<TrainingPage />);

    expect(dashboardProps().context.nameOf?.('user-1')).toBe('Asha Rao');
    expect(dashboardProps().context.nameOf?.('user-gone')).toBe('user-gone');
  });
});
