import { useConfirm } from '@/components/feedback/ConfirmProvider';
import { useNotify } from '@/components/feedback/NotificationProvider';
import {
  ApprovalDecision,
  MyPendingApprovalCountDocument,
  useDecideApprovalMutation,
} from '@/graphql/generated';

/** What a pending approval can become. Withdrawal stays the requester's own action. */
export type Decision = ApprovalDecision.Approved | ApprovalDecision.Rejected;
export type DecideApproval = (row: { id: string; kindLabel: string }, d: Decision) => Promise<void>;

export const DECISION_VERB: Record<Decision, string> = {
  [ApprovalDecision.Approved]: 'Approve',
  [ApprovalDecision.Rejected]: 'Reject',
};

/**
 * Confirms, then decides through `decideApproval` — which dispatches to whichever module
 * owns the record, so a leave balance is still debited and the requester is still told,
 * exactly as if the decision had been made on that module's own screen.
 */
export function useApprovalDecision(refetch: () => Promise<unknown>): DecideApproval {
  const [decideApproval] = useDecideApprovalMutation({
    refetchQueries: [MyPendingApprovalCountDocument],
  });
  const confirm = useConfirm();
  const notify = useNotify();

  return async (row, decision) => {
    const verb = DECISION_VERB[decision];
    const ok = await confirm({
      message: `${verb} this ${row.kindLabel.toLowerCase()}?`,
      confirmText: verb,
    });
    if (!ok) return;
    try {
      await decideApproval({ variables: { id: row.id, decision } });
      await refetch();
      notify(`${row.kindLabel} ${decision.toLowerCase()}`, 'success');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not record the decision', 'error');
    }
  };
}
