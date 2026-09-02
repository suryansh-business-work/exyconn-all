import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  useListAnnouncementsStatsQuery,
  useDeleteAnnouncementMutation,
  ListAnnouncementsPagedDocument,
  type ListAnnouncementsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { AnnouncementForm, type AnnouncementRow } from './forms/announcement';
import {
  ANNOUNCEMENT_COLUMNS,
  type PagedAnnouncementRow,
  type AnnouncementsGridContext,
} from './announcements-grid';

/** HR module — publishes the announcements every employee portal reads. */
export function AnnouncementsPage() {
  const { data: statsData, refetch: refetchStats } = useListAnnouncementsStatsQuery();
  const [deleteAnnouncement] = useDeleteAnnouncementMutation();
  const { formatDate } = useSettings();

  const crud = useCrudResource<AnnouncementRow, PagedAnnouncementRow>({
    label: 'Announcement',
    onDelete: (row) => deleteAnnouncement({ variables: { id: row.id } }),
    confirmMessage: (row) => `Delete announcement "${row.title}"?`,
    refetch: refetchStats,
  });
  const fetchRows = usePagedFetcher(
    ListAnnouncementsPagedDocument,
    (data: ListAnnouncementsPagedQuery) => data.listAnnouncementsPaged,
  );

  const stats = statsData?.listAnnouncementsStats;
  const statItems: StatItem[] = [
    { label: 'Announcements', value: String(statTotal(stats)), accent: '#155dfc' },
    { label: 'Notices', value: String(statCount(stats, 'category', 'NOTICE')), accent: '#0ea5e9' },
    { label: 'Policies', value: String(statCount(stats, 'category', 'POLICY')), accent: '#a855f7' },
    { label: 'Events', value: String(statCount(stats, 'category', 'EVENT')), accent: '#f97316' },
  ];

  const gridContext: AnnouncementsGridContext = {
    actions: { edit: crud.openEdit, delete: crud.remove },
    formatDate,
  };

  return (
    <CrudDashboard
      title="Announcements"
      subtitle="Company notices, policies and updates"
      entityLabel="announcement"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <AnnouncementForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      columnDefs={ANNOUNCEMENT_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search announcements…"
    />
  );
}
