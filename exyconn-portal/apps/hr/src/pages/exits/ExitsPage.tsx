import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  useListExitRecordsStatsQuery,
  useDeleteExitRecordMutation,
  ListExitRecordsPagedDocument,
  type ListExitRecordsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { ExitRecordForm, type ExitRecordRow } from './forms/exit-record';
import {
  EXIT_RECORD_COLUMNS,
  type PagedExitRecordRow,
  type ExitRecordGridContext,
} from './exit-record-grid';

/** Exits & Offboarding — server-paged admin grid over the exit record records. */
export function ExitsPage() {
  const { data: statsData, refetch: refetchStats } = useListExitRecordsStatsQuery();
  const [deleteExitRecord] = useDeleteExitRecordMutation();
  const { formatDate } = useSettings();

  const crud = useCrudResource<ExitRecordRow, PagedExitRecordRow>({
    label: 'ExitRecord',
    onDelete: (row) => deleteExitRecord({ variables: { id: row.id } }),
    confirmMessage: () => 'Delete this exit record?',
    refetch: refetchStats,
  });
  const fetchRows = usePagedFetcher(
    ListExitRecordsPagedDocument,
    (data: ListExitRecordsPagedQuery) => data.listExitRecordsPaged,
  );

  const stats = statsData?.listExitRecordsStats;
  const statItems: StatItem[] = [
    { label: 'Exits', value: String(statTotal(stats)), accent: '#64748b' },
    {
      label: 'Notice period',
      value: String(statCount(stats, 'stage', 'NOTICE_PERIOD')),
      accent: '#64748b',
    },
    {
      label: 'Clearance',
      value: String(statCount(stats, 'stage', 'CLEARANCE')),
      accent: '#64748b',
    },
    { label: 'Exited', value: String(statCount(stats, 'stage', 'EXITED')), accent: '#64748b' },
  ];

  const gridContext: ExitRecordGridContext = {
    actions: { edit: crud.openEdit, delete: crud.remove },
    formatDate,
  };

  return (
    <CrudDashboard
      title="Exits & Offboarding"
      subtitle="Resignations, clearance and full & final"
      entityLabel="exit record"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <ExitRecordForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      columnDefs={EXIT_RECORD_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search exits…"
    />
  );
}
