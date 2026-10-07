import { vi } from 'vitest';
import { HolidayType, ListHolidaysPagedDocument } from '@exyconn/shell/graphql/generated';
import { HolidaysPage } from '../../../../src/pages/holidays';
import { HOLIDAY_COLUMNS } from '../../../../src/pages/holidays/holiday-grid';
import { tableStats } from '../../harness/crud-page';
import { describeCrudPage } from '../../harness/crud-page-suite';

const gql = vi.hoisted(() => ({ stats: vi.fn(), remove: vi.fn(), refetch: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListHolidaysStatsQuery: () => gql.stats(),
  useDeleteHolidayMutation: () => [gql.remove],
}));

vi.mock('@exyconn/crud', async (importOriginal) => {
  const stub = await import('../../harness/crud-dashboard');
  return {
    ...(await importOriginal<typeof import('@exyconn/crud')>()),
    CrudDashboard: stub.CrudDashboardStub,
    usePagedFetcher: stub.usePagedFetcherStub,
  };
});

vi.mock('../../../../src/pages/holidays/forms/holiday', async () => ({
  HolidayForm: (await import('../../harness/form-stub')).FormStub,
}));

describeCrudPage('HolidaysPage', {
  page: <HolidaysPage />,
  mocks: gql,
  statsKey: 'listHolidaysStats',
  stats: tableStats(15, { type: { PUBLIC: 10, OPTIONAL: 3, RESTRICTED: 2 } }),
  lines: ['Holidays: 15', 'Public: 10', 'Optional: 3', 'Restricted: 2'],
  emptyLines: ['Holidays: 0', 'Public: 0', 'Optional: 0', 'Restricted: 0'],
  document: ListHolidaysPagedDocument,
  pageKey: 'listHolidaysPaged',
  columns: HOLIDAY_COLUMNS,
  meta: {
    title: 'Holidays',
    exportFileName: 'holidays',
    entityLabel: 'holiday',
    searchPlaceholder: 'Search holidays…',
  },
  row: { id: 'holiday-9', name: 'Diwali', type: HolidayType.Public, country: 'IN' },
  confirm: 'Delete this holiday?',
  entity: 'Holiday',
});
