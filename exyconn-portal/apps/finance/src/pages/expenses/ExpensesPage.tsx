import { useState } from 'react';
import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  ExpenseStatus,
  useListExpenseClaimsStatsQuery,
  useDeleteExpenseClaimMutation,
  useSetExpenseClaimStatusMutation,
  ListExpenseClaimsPagedDocument,
  type ListExpenseClaimsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { ExpenseClaimForm, type ExpenseClaimRow } from './forms/expense-claim';
import { ApproveClaimForm } from './forms/approve-claim';
import {
  EXPENSE_CLAIM_COLUMNS,
  type PagedExpenseClaimRow,
  type ExpenseClaimGridContext,
} from './expense-claim-grid';

/** Expense Claims — server-paged admin grid over the claim records, with finance's decisions. */
export function ExpensesPage() {
  const { data: statsData, refetch: refetchStats } = useListExpenseClaimsStatsQuery();
  const [deleteExpenseClaim] = useDeleteExpenseClaimMutation();
  const [setStatus] = useSetExpenseClaimStatusMutation();
  const [approveTarget, setApproveTarget] = useState<PagedExpenseClaimRow | null>(null);
  const { formatDate } = useSettings();
  const confirm = useConfirm();
  const notify = useNotify();

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

  /** Reject or pay, after a confirmation. Approval has its own form for the amount. */
  const decide = async (row: PagedExpenseClaimRow, status: ExpenseStatus, question: string) => {
    const ok = await confirm({
      message: question,
      confirmText: status === 'PAID' ? 'Mark paid' : 'Reject',
    });
    if (!ok) return;
    try {
      await setStatus({ variables: { id: row.id, status } });
      crud.reload();
      notify(status === 'PAID' ? 'Claim marked as paid' : 'Claim rejected');
    } catch (error) {
      notify(errorMessage(error, 'Could not update the claim'), 'error');
    }
  };

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
    actions: {
      approve: setApproveTarget,
      reject: (row) =>
        decide(row, ExpenseStatus.Rejected, `Reject the ${row.category} claim for ${row.amount}?`),
      pay: (row) =>
        decide(
          row,
          ExpenseStatus.Paid,
          `Record the ${row.category} claim as reimbursed today for ${row.approvedAmount ?? row.amount}?`,
        ),
      edit: crud.openEdit,
      delete: crud.remove,
    },
    formatDate,
  };

  const closeApprove = () => setApproveTarget(null);

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
      extraDialogs={
        <CrudDialog open={Boolean(approveTarget)} title="Approve claim" onClose={closeApprove}>
          {approveTarget && (
            <ApproveClaimForm
              claim={approveTarget}
              onCancel={closeApprove}
              onDone={() => {
                crud.reload();
                closeApprove();
              }}
            />
          )}
        </CrudDialog>
      }
    />
  );
}
