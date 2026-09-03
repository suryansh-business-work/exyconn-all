import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statSum, statTotal } from '@exyconn/shell/components/data/tableStats';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  useListLeaveBalancesStatsQuery,
  useDeleteLeaveBalanceMutation,
  ListLeaveBalancesPagedDocument,
  type ListLeaveBalancesPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { LeaveBalanceForm, type LeaveBalanceRow } from './forms/leave-balance';
import {
  LEAVE_BALANCE_COLUMNS,
  type PagedLeaveBalanceRow,
  type LeaveBalanceGridContext,
} from './leave-balance-grid';

/** Leave Balances — server-paged admin grid over the balance records. */
export function LeaveBalancesPage() {
  const { data: statsData, refetch: refetchStats } = useListLeaveBalancesStatsQuery();
  const [deleteLeaveBalance] = useDeleteLeaveBalanceMutation();
  const { formatDate } = useSettings();

  const crud = useCrudResource<LeaveBalanceRow, PagedLeaveBalanceRow>({
    label: 'LeaveBalance',
    onDelete: (row) => deleteLeaveBalance({ variables: { id: row.id } }),
    confirmMessage: () => 'Delete this balance?',
    refetch: refetchStats,
  });
  const fetchRows = usePagedFetcher(
    ListLeaveBalancesPagedDocument,
    (data: ListLeaveBalancesPagedQuery) => data.listLeaveBalancesPaged,
  );

  const stats = statsData?.listLeaveBalancesStats;
  const statItems: StatItem[] = [
    { label: 'Records', value: String(statTotal(stats)), accent: '#0ea5e9' },
    { label: 'Allocated', value: String(statSum(stats, 'allocated')), accent: '#0ea5e9' },
    { label: 'Used', value: String(statSum(stats, 'used')), accent: '#0ea5e9' },
    { label: 'Employees', value: String(statTotal(stats)), accent: '#0ea5e9' },
  ];

  const gridContext: LeaveBalanceGridContext = {
    actions: { edit: crud.openEdit, delete: crud.remove },
    formatDate,
  };

  return (
    <CrudDashboard
      title="Leave Balances"
      subtitle="Per employee, per policy, per year"
      entityLabel="balance"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <LeaveBalanceForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      columnDefs={LEAVE_BALANCE_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search balances…"
    />
  );
}
