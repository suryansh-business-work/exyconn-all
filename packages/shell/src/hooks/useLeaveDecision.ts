import { useConfirm } from '@/components/feedback/ConfirmProvider';
import { useNotify } from '@/components/feedback/NotificationProvider';
import { LeaveStatus, useSetLeaveStatusMutation } from '@/graphql/generated';

/** Where a pending leave request can go. */
export type LeaveDecision = LeaveStatus.Approved | LeaveStatus.Rejected;
export type DecideLeave = (row: { id: string }, status: LeaveDecision) => Promise<void>;

export const LEAVE_DECISION_VERB: Record<LeaveDecision, string> = {
  [LeaveStatus.Approved]: 'Approve',
  [LeaveStatus.Rejected]: 'Reject',
};

/** Whole sentences per decision — a verb glued to a noun cannot be translated. */
export const LEAVE_DECISION_PROMPT: Record<LeaveDecision, string> = {
  [LeaveStatus.Approved]: 'Approve this leave request?',
  [LeaveStatus.Rejected]: 'Reject this leave request?',
};

export const LEAVE_DECISION_DONE: Record<LeaveDecision, string> = {
  [LeaveStatus.Approved]: 'Leave approved',
  [LeaveStatus.Rejected]: 'Leave rejected',
};

/**
 * Confirms, then moves the request through `setLeaveStatus` — the one mutation every
 * screen decides from (HR's queue, the employee record, a manager's team page), so the
 * balance debit and the employee's notification happen once, on the server.
 */
export function useLeaveDecision(refetch: () => Promise<unknown>): DecideLeave {
  const [setStatus] = useSetLeaveStatusMutation();
  const confirm = useConfirm();
  const notify = useNotify();

  return async (row, status) => {
    const ok = await confirm({
      message: LEAVE_DECISION_PROMPT[status],
      confirmText: LEAVE_DECISION_VERB[status],
    });
    if (!ok) return;
    try {
      await setStatus({ variables: { id: row.id, status } });
      await refetch();
      notify(LEAVE_DECISION_DONE[status]);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not update the leave request', 'error');
    }
  };
}
