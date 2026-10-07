import { vi } from 'vitest';
import { ListShiftsPagedDocument } from '@exyconn/shell/graphql/generated';
import { ShiftsPage } from '../../../../src/pages/shifts';
import { SHIFT_COLUMNS } from '../../../../src/pages/shifts/shift-grid';
import { tableStats } from '../../harness/crud-page';
import { describeCrudPage } from '../../harness/crud-page-suite';

const gql = vi.hoisted(() => ({ stats: vi.fn(), remove: vi.fn(), refetch: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListShiftsStatsQuery: () => gql.stats(),
  useDeleteShiftMutation: () => [gql.remove],
}));

vi.mock('@exyconn/crud', async (importOriginal) => {
  const stub = await import('../../harness/crud-dashboard');
  return {
    ...(await importOriginal<typeof import('@exyconn/crud')>()),
    CrudDashboard: stub.CrudDashboardStub,
    usePagedFetcher: stub.usePagedFetcherStub,
  };
});

vi.mock('../../../../src/pages/shifts/forms/shift', async () => ({
  ShiftForm: (await import('../../harness/form-stub')).FormStub,
}));

describeCrudPage('ShiftsPage', {
  page: <ShiftsPage />,
  mocks: gql,
  statsKey: 'listShiftsStats',
  stats: tableStats(5, { active: { true: 4, false: 1 } }),
  // The page repeats the total as its fourth tile.
  lines: ['Shifts: 5', 'Active: 4', 'Inactive: 1', 'Shifts: 5'],
  emptyLines: ['Shifts: 0', 'Active: 0', 'Inactive: 0', 'Shifts: 0'],
  document: ListShiftsPagedDocument,
  pageKey: 'listShiftsPaged',
  columns: SHIFT_COLUMNS,
  meta: {
    title: 'Shifts',
    exportFileName: 'shifts',
    entityLabel: 'shift',
    searchPlaceholder: 'Search shifts…',
  },
  row: {
    id: 'shift-1',
    name: 'Morning',
    code: 'AM',
    startTime: '09:00',
    endTime: '18:00',
    breakMinutes: 60,
    graceMinutes: 15,
    active: true,
  },
  confirm: 'Delete this shift?',
  entity: 'Shift',
});
