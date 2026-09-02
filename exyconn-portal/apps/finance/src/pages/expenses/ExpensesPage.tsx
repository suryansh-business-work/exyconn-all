import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  useListExpenseClaimsStatsQuery,
  useDeleteExpenseClaimMutation,
  ListExpenseClaimsPagedDocument,
  type ListExpenseClaimsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { ExpenseClaimForm, type ExpenseClaimRow } from './forms/expense-claim';
import {
  EXPENSE_CLAIM_COLUMNS,
  type PagedExpenseClaimRow,
  type ExpenseClaimGridContext,
} from './expense-claim-grid';

/** Expense Claims — server-paged admin grid over the claim records. */
export function ExpensesPage() {
  const { data: statsData, refetch: refetchStats } = useListExpenseClaimsStatsQuery();
  const [deleteExpenseClaim] = useDeleteExpenseClaimMutation();
  const { formatDate } = useSettings();

  const crud = useCrudResource<ExpenseClaimRow, PagedExpenseClaimRow>({
    label: 'ExpenseClaim',
    onDelete: (row) => deleteExpenseClaim({ variables: { id: row.id } }),
    confirmMessage: () => 'Delete this claim?',
    refetch: refetchStats,
  });
  const fetchRows = usePagedFetcher(
    ListExpenseClaimsPagedDocument,
    (data: ListExpenseClaimsPagedQuery) => data.listExpenseClaimsPaged,
  );

  const stats = statsData?.listExpenseClaimsStats;
  const statItems: StatItem[] = [
    { label: 'Claims', value: String(statTotal(stats)), accent: '#ef4444' },
    {
      label: 'Submitted',
      value: String(statCount(stats, 'status', 'SUBMITTED')),
      accent: '#ef4444',
    },
    { label: 'Approved', value: String(statCount(stats, 'status', 'APPROVED')), accent: '#ef4444' },
    { label: 'Paid', value: String(statCount(stats, 'status', 'PAID')), accent: '#ef4444' },
  ];

  const gridContext: ExpenseClaimGridContext = {
    actions: { edit: crud.openEdit, delete: crud.remove },
    formatDate,
  };

  return (
    <CrudDashboard
      title="Expense Claims"
      subtitle="Employee reimbursements"
      entityLabel="claim"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <ExpenseClaimForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      columnDefs={EXPENSE_CLAIM_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search claims…"
    />
  );
}
