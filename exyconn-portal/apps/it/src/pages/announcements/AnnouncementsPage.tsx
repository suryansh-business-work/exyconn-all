import type { ColDef } from 'ag-grid-community';
import {
  CrudDashboard,
  actionsColumn,
  boolColumn,
  dateColumn,
  statusColumn,
  textColumn,
  useCrudResource,
  usePagedFetcher,
  type DatedCrudGridContext,
} from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount } from '@exyconn/shell/components/data/tableStats';
import { color } from '@exyconn/shell/components/ui';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { AnnouncementForm, type AnnouncementRow } from '@exyconn/shell/pages/content-forms';
import {
  AnnouncementCategory,
  ListItAnnouncementsPagedDocument,
  useDeleteAnnouncementMutation,
  useListAnnouncementsStatsQuery,
  type ListItAnnouncementsPagedQuery,
} from '@exyconn/shell/graphql/generated';

type PagedAnnouncementRow =
  ListItAnnouncementsPagedQuery['listItAnnouncementsPaged']['rows'][number];

/** What IT announces. Everything else is HR's, and the server holds IT to that. */
const IT_CATEGORIES = [
  AnnouncementCategory.Maintenance,
  AnnouncementCategory.Outage,
  AnnouncementCategory.SecurityAlert,
];

const COLUMNS: ColDef<PagedAnnouncementRow>[] = [
  textColumn('title', 'Title'),
  statusColumn('category', 'Kind'),
  statusColumn('audience', 'Audience'),
  boolColumn('pinned', 'Pinned'),
  dateColumn('publishedAt', 'Published'),
  dateColumn('expiresAt', 'Expires', '—'),
  actionsColumn(),
];

/** IT › Announcements: maintenance windows, outages and security alerts, told to staff. */
export function AnnouncementsPage() {
  const { formatDate } = useSettings();
  const { data: statsData, refetch: refetchStats } = useListAnnouncementsStatsQuery();
  const [remove] = useDeleteAnnouncementMutation();
  const crud = useCrudResource<AnnouncementRow, PagedAnnouncementRow>({
    label: 'Announcement',
    onDelete: (row) => remove({ variables: { id: row.id } }),
    confirmMessage: (row) => ({ message: 'Delete "{title}"?', values: { title: row.title } }),
    refetch: refetchStats,
  });
  const fetchRows = usePagedFetcher(
    ListItAnnouncementsPagedDocument,
    (data: ListItAnnouncementsPagedQuery) => data.listItAnnouncementsPaged,
  );

  const stats = statsData?.listAnnouncementsStats;
  const statItems: StatItem[] = [
    {
      label: 'Maintenance windows',
      value: String(statCount(stats, 'category', AnnouncementCategory.Maintenance)),
      accent: color.amber[500],
    },
    {
      label: 'Outages',
      value: String(statCount(stats, 'category', AnnouncementCategory.Outage)),
      accent: color.red[500],
    },
    {
      label: 'Security alerts',
      value: String(statCount(stats, 'category', AnnouncementCategory.SecurityAlert)),
      accent: color.violet[400],
    },
  ];
  const gridContext: DatedCrudGridContext<PagedAnnouncementRow> = {
    actions: { edit: crud.openEdit, delete: crud.remove },
    formatDate,
  };

  return (
    <CrudDashboard
      title="Announcements"
      subtitle="Maintenance windows, outages and security alerts"
      entityLabel="announcement"
      exportFileName="it-announcements"
      permissionModule="Announcement"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <AnnouncementForm
          initial={initial}
          categories={IT_CATEGORIES}
          onCancel={crud.close}
          onDone={crud.onDone}
        />
      )}
      columnDefs={COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search announcements…"
    />
  );
}
