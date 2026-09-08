import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statTotal } from '@exyconn/shell/components/data/tableStats';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  ListStatusMaintenanceWindowsPagedDocument,
  useDeleteStatusMaintenanceMutation,
  useListStatusMaintenanceWindowsStatsQuery,
  type ListStatusMaintenanceWindowsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { MaintenanceForm, type MaintenanceRow } from './forms/maintenance';
import {
  MAINTENANCE_COLUMNS,
  type MaintenanceGridContext,
  type PagedMaintenanceRow,
} from './maintenance-grid';

/** Planned windows: announced on the public page while upcoming or in progress. */
export function MaintenancePanel() {
  const { formatDate } = useSettings();
  const { data: statsData, refetch: refetchStats } = useListStatusMaintenanceWindowsStatsQuery();
  const [deleteWindow] = useDeleteStatusMaintenanceMutation();

  const crud = useCrudResource<MaintenanceRow, PagedMaintenanceRow>({
    label: 'Maintenance window',
    onDelete: (row) => deleteWindow({ variables: { id: row.id } }),
    confirmMessage: (row) => `Cancel the maintenance window "${row.title}"?`,
    refetch: refetchStats,
  });
  const fetchRows = usePagedFetcher(
    ListStatusMaintenanceWindowsPagedDocument,
    (data: ListStatusMaintenanceWindowsPagedQuery) => data.listStatusMaintenanceWindowsPaged,
  );

  const statItems: StatItem[] = [
    {
      label: 'Windows',
      value: String(statTotal(statsData?.listStatusMaintenanceWindowsStats)),
      accent: '#4f8cff',
    },
  ];

  const gridContext: MaintenanceGridContext = {
    actions: { edit: crud.openEdit, delete: crud.remove },
    formatDate,
  };

  return (
    <CrudDashboard
      title="Maintenance"
      subtitle="Planned downtime, announced on the status page ahead of time"
      entityLabel="maintenance window"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <MaintenanceForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      columnDefs={MAINTENANCE_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search by title…"
    />
  );
}
