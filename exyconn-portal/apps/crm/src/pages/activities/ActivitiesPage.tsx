import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import {
  useListActivitiesStatsQuery,
  useDeleteActivityMutation,
  ListActivitiesPagedDocument,
  type ListActivitiesPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { ActivityForm, type ActivityRow } from './forms/activity';
import {
  ACTIVITY_COLUMNS,
  type PagedActivityRow,
  type ActivitiesGridContext,
} from './activities-grid';

/** CRM → Activities: what was said, and what still has to be done about it. */
export function ActivitiesPage() {
  const { data: statsData, refetch: refetchStats } = useListActivitiesStatsQuery();
  const [deleteActivity] = useDeleteActivityMutation();
  const crud = useCrudResource<ActivityRow, PagedActivityRow>({
    label: 'Activity',
    onDelete: (row) => deleteActivity({ variables: { id: row.id } }),
    confirmMessage: (row) => `Delete activity "${row.subject}"?`,
    refetch: refetchStats,
  });
  const fetchRows = usePagedFetcher(
    ListActivitiesPagedDocument,
    (data: ListActivitiesPagedQuery) => data.listActivitiesPaged,
  );

  const stats = statsData?.listActivitiesStats;
  const statItems: StatItem[] = [
    { label: 'Activities', value: String(statTotal(stats)), accent: '#4f8cff' },
    { label: 'Calls', value: String(statCount(stats, 'type', 'CALL')), accent: '#22c55e' },
    { label: 'Meetings', value: String(statCount(stats, 'type', 'MEETING')), accent: '#8b5cf6' },
    { label: 'Tasks', value: String(statCount(stats, 'type', 'TASK')), accent: '#f59e0b' },
  ];

  const gridContext: ActivitiesGridContext = {
    actions: { edit: crud.openEdit, delete: crud.remove },
  };

  return (
    <CrudDashboard
      title="Activities"
      subtitle="Calls, meetings, notes and follow-ups"
      entityLabel="activity"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <ActivityForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      columnDefs={ACTIVITY_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search by subject, related record or owner…"
    />
  );
}
