import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statSum, statTotal } from '@exyconn/shell/components/data/tableStats';
import { formatMoney } from '@exyconn/shell/utils/money';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import {
  useListCompanyExpensesStatsQuery,
  useDeleteCompanyExpenseMutation,
  useMarkExpensePaidMutation,
  ListCompanyExpensesPagedDocument,
  type ListCompanyExpensesPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { CompanyExpenseForm, type CompanyExpenseRow } from './forms/company-expense';
import {
  companyExpenseColumns,
  type PagedCompanyExpenseRow,
  type CompanyExpensesGridContext,
} from './company-expenses-grid';

/**
 * Finance → Company expenses: what the business itself spends.
 *
 * Distinct from Expense Claims, which is an employee asking to be reimbursed. Both end up as
 * company cost and the dashboard counts them separately, so it can always say which is which.
 */
export function CompanyExpensesPage() {
  const { data: statsData, refetch: refetchStats } = useListCompanyExpensesStatsQuery();
  const [deleteExpense] = useDeleteCompanyExpenseMutation();
  const [markPaid] = useMarkExpensePaidMutation();
  const { formatDate } = useSettings();
  const confirm = useConfirm();
  const notify = useNotify();

  const crud = useCrudResource<CompanyExpenseRow, PagedCompanyExpenseRow>({
    label: 'Expense',
    onDelete: (row) => deleteExpense({ variables: { id: row.id } }),
    confirmMessage: (row) => `Delete the ${row.vendor} bill?`,
    refetch: refetchStats,
  });
  const fetchRows = usePagedFetcher(
    ListCompanyExpensesPagedDocument,
    (data: ListCompanyExpensesPagedQuery) => data.listCompanyExpensesPaged,
  );

  const stats = statsData?.listCompanyExpensesStats;
  const statItems: StatItem[] = [
    { label: 'Bills', value: String(statTotal(stats)), accent: '#4f8cff' },
    { label: 'Recorded', value: formatMoney(statSum(stats, 'amount')), accent: '#8b5cf6' },
    { label: 'Unpaid', value: String(statCount(stats, 'status', 'UNPAID')), accent: '#ff6b6b' },
    { label: 'Paid', value: String(statCount(stats, 'status', 'PAID')), accent: '#22c55e' },
  ];

  /** Settles a bill today. The server writes `paidOn`, which is what cash flow is built on. */
  const settle = async (row: PagedCompanyExpenseRow) => {
    const ok = await confirm({
      message: `Record the ${row.vendor} bill as paid today?`,
      confirmText: 'Mark paid',
    });
    if (!ok) return;
    try {
      await markPaid({ variables: { id: row.id } });
      await refetchStats();
      crud.onDone();
      notify('Bill settled');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not settle the bill', 'error');
    }
  };

  const gridContext: CompanyExpensesGridContext = {
    actions: { settle, edit: crud.openEdit, delete: crud.remove },
    formatDate,
  };

  return (
    <CrudDashboard
      title="Company expenses"
      subtitle="What the business spends, and what it still owes"
      entityLabel="expense"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <CompanyExpenseForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      columnDefs={companyExpenseColumns(formatDate)}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search by vendor, description or reference…"
    />
  );
}
