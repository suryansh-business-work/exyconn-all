import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  useListShiftsStatsQuery,
  useDeleteShiftMutation,
  ListShiftsPagedDocument,
  type ListShiftsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { ShiftForm, type ShiftRow } from './forms/shift';
import { SHIFT_COLUMNS, type PagedShiftRow, type ShiftGridContext } from './shift-grid';

/** Shifts — server-paged admin grid over the shift records. */
export function ShiftsPage() {
  const { data: statsData, refetch: refetchStats } = useListShiftsStatsQuery();
  const [deleteShift] = useDeleteShiftMutation();
  const { formatDate } = useSettings();

  const crud = useCrudResource<ShiftRow, PagedShiftRow>({
    label: 'Shift',
    onDelete: (row) => deleteShift({ variables: { id: row.id } }),
    confirmMessage: () => 'Delete this shift?',
    refetch: refetchStats,
  });
  const fetchRows = usePagedFetcher(
    ListShiftsPagedDocument,
    (data: ListShiftsPagedQuery) => data.listShiftsPaged,
  );

  const stats = statsData?.listShiftsStats;
  const statItems: StatItem[] = [
    { label: 'Shifts', value: String(statTotal(stats)), accent: '#e11d48' },
    { label: 'Active', value: String(statCount(stats, 'active', 'true')), accent: '#e11d48' },
    { label: 'Inactive', value: String(statCount(stats, 'active', 'false')), accent: '#e11d48' },
    { label: 'Shifts', value: String(statTotal(stats)), accent: '#e11d48' },
  ];

  const gridContext: ShiftGridContext = {
    actions: { edit: crud.openEdit, delete: crud.remove },
    formatDate,
  };

  return (
    <CrudDashboard
      title="Shifts"
      subtitle="Working-hour patterns and late rules"
      entityLabel="shift"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <ShiftForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      columnDefs={SHIFT_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search shifts…"
    />
  );
}
