import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import {
  StatusState,
  useListStatusMonitorsStatsQuery,
  useDeleteStatusMonitorMutation,
  ListStatusMonitorsPagedDocument,
  type ListStatusMonitorsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { StatusMonitorForm, type StatusMonitorRow } from './forms/status-monitor';
import {
  STATUS_MONITOR_COLUMNS,
  type PagedStatusMonitorRow,
  type StatusMonitorsGridContext,
} from './status-monitors-grid';

/** Tech module — the catalogue of endpoints the public status page reports on. */
export function StatusMonitorsPage() {
  const { data: statsData, refetch: refetchStats } = useListStatusMonitorsStatsQuery();
  const [deleteMonitor] = useDeleteStatusMonitorMutation();
  const crud = useCrudResource<StatusMonitorRow, PagedStatusMonitorRow>({
    label: 'Status monitor',
    onDelete: (row) => deleteMonitor({ variables: { id: row.id } }),
    confirmMessage: (row) => `Stop monitoring "${row.name}"?`,
    refetch: refetchStats,
  });
  const fetchRows = usePagedFetcher(
    ListStatusMonitorsPagedDocument,
    (data: ListStatusMonitorsPagedQuery) => data.listStatusMonitorsPaged,
  );

  const stats = statsData?.listStatusMonitorsStats;
  const statItems: StatItem[] = [
    { label: 'Monitors', value: String(statTotal(stats)), accent: '#4f8cff' },
    {
      label: 'Operational',
      value: String(statCount(stats, 'state', StatusState.Operational)),
      accent: '#7be37b',
    },
    {
      label: 'Degraded',
      value: String(statCount(stats, 'state', StatusState.Degraded)),
      accent: '#f9851f',
    },
    {
      label: 'Down',
      value: String(statCount(stats, 'state', StatusState.Down)),
      accent: '#ff6b6b',
    },
  ];

  const gridContext: StatusMonitorsGridContext = {
    actions: { edit: crud.openEdit, delete: crud.remove },
  };

  return (
    <CrudDashboard
      title="Status Monitors"
      subtitle="Every endpoint status.exyconn.com watches, and what it reported last"
      entityLabel="monitor"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <StatusMonitorForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      columnDefs={STATUS_MONITOR_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search by service, key or URL…"
    />
  );
}
