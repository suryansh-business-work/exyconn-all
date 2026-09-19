import { useMemo } from 'react';
import { useConfirm } from '@/components/feedback/ConfirmProvider';
import { useNotify } from '@/components/feedback/NotificationProvider';
import { errorMessage } from '@/utils/errorMessage';
import type { SelectOption } from '@/components/form/rhf';
import {
  useDeleteLeaveBalanceMutation,
  useEmployeeLeaveBalancesQuery,
  useListLeavePoliciesQuery,
} from '@/graphql/generated';
import type { LeaveBalanceRow } from './forms/leave-balance';

/**
 * One employee's balances for a year, the leave types HR offers, and removing a balance. The
 * server fills in every type the employee's country offers, so the rows are complete.
 */
export function useEmployeeLeaveBalances(employeeId: string, year: number) {
  const confirm = useConfirm();
  const notify = useNotify();
  const balances = useEmployeeLeaveBalancesQuery({
    variables: { employeeId, year },
    fetchPolicy: 'cache-and-network',
  });
  const policies = useListLeavePoliciesQuery();
  const [deleteBalance] = useDeleteLeaveBalanceMutation();

  const rows = useMemo(() => balances.data?.employeeLeaveBalances ?? [], [balances.data]);
  const names = useMemo(
    () =>
      new Map((policies.data?.listLeavePolicies ?? []).map((policy) => [policy.code, policy.name])),
    [policies.data],
  );
  const addable: SelectOption[] = useMemo(() => {
    const held = new Set(rows.map((row) => row.leaveTypeCode));
    return (policies.data?.listLeavePolicies ?? [])
      .filter((policy) => !held.has(policy.code))
      .map((policy) => ({ value: policy.code, label: `${policy.name} (${policy.code})` }));
  }, [policies.data, rows]);

  const remove = async (row: LeaveBalanceRow) => {
    const ok = await confirm({
      message: 'Remove the {type} balance for {year}? Days already taken stay on their requests.',
      messageValues: { type: row.leaveTypeCode, year },
      confirmText: 'Remove',
    });
    if (!ok) return;
    try {
      await deleteBalance({ variables: { id: row.id } });
      await balances.refetch();
      notify('Leave balance removed');
    } catch (error) {
      notify(errorMessage(error, 'Could not remove the leave balance'), 'error');
    }
  };

  return {
    rows,
    loading: balances.loading || policies.loading,
    error: balances.error,
    refetch: balances.refetch,
    nameOf: (code: string) => names.get(code) ?? code,
    addable,
    remove,
  };
}
