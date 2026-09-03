import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statSum, statTotal } from '@exyconn/shell/components/data/tableStats';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  useListLeavePoliciesStatsQuery,
  useDeleteLeavePolicyMutation,
  ListLeavePoliciesPagedDocument,
  type ListLeavePoliciesPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { LeavePolicyForm, type LeavePolicyRow } from './forms/leave-policy';
import {
  LEAVE_POLICY_COLUMNS,
  type PagedLeavePolicyRow,
  type LeavePolicyGridContext,
} from './leave-policy-grid';

/** Leave Policies — server-paged admin grid over the leave policy records. */
export function LeavePoliciesPage() {
  const { data: statsData, refetch: refetchStats } = useListLeavePoliciesStatsQuery();
  const [deleteLeavePolicy] = useDeleteLeavePolicyMutation();
  const { formatDate } = useSettings();

  const crud = useCrudResource<LeavePolicyRow, PagedLeavePolicyRow>({
    label: 'LeavePolicy',
    onDelete: (row) => deleteLeavePolicy({ variables: { id: row.id } }),
    confirmMessage: () => 'Delete this leave policy?',
    refetch: refetchStats,
  });
  const fetchRows = usePagedFetcher(
    ListLeavePoliciesPagedDocument,
    (data: ListLeavePoliciesPagedQuery) => data.listLeavePoliciesPaged,
  );

  const stats = statsData?.listLeavePoliciesStats;
  const statItems: StatItem[] = [
    { label: 'Policies', value: String(statTotal(stats)), accent: '#8b5cf6' },
    { label: 'Active', value: String(statCount(stats, 'active', 'true')), accent: '#8b5cf6' },
    { label: 'Inactive', value: String(statCount(stats, 'active', 'false')), accent: '#8b5cf6' },
    { label: 'Total quota', value: String(statSum(stats, 'annualQuota')), accent: '#8b5cf6' },
  ];

  const gridContext: LeavePolicyGridContext = {
    actions: { edit: crud.openEdit, delete: crud.remove },
    formatDate,
  };

  return (
    <CrudDashboard
      title="Leave Policies"
      subtitle="Leave types, quotas and carry-forward rules"
      entityLabel="leave policy"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <LeavePolicyForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      columnDefs={LEAVE_POLICY_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search policies…"
    />
  );
}
