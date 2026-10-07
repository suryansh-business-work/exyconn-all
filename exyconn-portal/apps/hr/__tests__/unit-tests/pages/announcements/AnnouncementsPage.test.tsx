import { vi } from 'vitest';
import { ListAnnouncementsPagedDocument } from '@exyconn/shell/graphql/generated';
import { AnnouncementsPage } from '../../../../src/pages/announcements';
import { ANNOUNCEMENT_COLUMNS } from '../../../../src/pages/announcements/announcements-grid';
import { tableStats } from '../../harness/crud-page';
import { describeCrudPage } from '../../harness/crud-page-suite';

const gql = vi.hoisted(() => ({ stats: vi.fn(), remove: vi.fn(), refetch: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListAnnouncementsStatsQuery: () => gql.stats(),
  useDeleteAnnouncementMutation: () => [gql.remove],
}));

vi.mock('@exyconn/crud', async (importOriginal) => {
  const stub = await import('../../harness/crud-dashboard');
  return {
    ...(await importOriginal<typeof import('@exyconn/crud')>()),
    CrudDashboard: stub.CrudDashboardStub,
    usePagedFetcher: stub.usePagedFetcherStub,
  };
});

/** The announcement form is the shell's and has its own tests there. */
vi.mock('@exyconn/shell/pages/content-forms', async () => ({
  AnnouncementForm: (await import('../../harness/form-stub')).FormStub,
}));

describeCrudPage('AnnouncementsPage', {
  page: <AnnouncementsPage />,
  mocks: gql,
  statsKey: 'listAnnouncementsStats',
  stats: tableStats(11, { category: { NOTICE: 5, POLICY: 4, EVENT: 2 } }),
  lines: ['Announcements: 11', 'Notices: 5', 'Policies: 4', 'Events: 2'],
  emptyLines: ['Announcements: 0', 'Notices: 0', 'Policies: 0', 'Events: 0'],
  document: ListAnnouncementsPagedDocument,
  pageKey: 'listAnnouncementsPaged',
  columns: ANNOUNCEMENT_COLUMNS,
  meta: {
    title: 'Announcements',
    exportFileName: 'announcements',
    entityLabel: 'announcement',
    searchPlaceholder: 'Search announcements…',
  },
  row: { id: 'ann-5', title: 'Office closed Friday' },
  confirm: 'Delete announcement "Office closed Friday"?',
  entity: 'Announcement',
});
