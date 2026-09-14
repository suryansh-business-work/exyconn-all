import { useT } from '@exyconn/i18n';
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

/** Whole sentences per decision — a verb glued to a noun cannot be translated. */
const DECISION_PROMPT: Record<Decision, string> = {
  [ApprovalDecision.Approved]: 'Approve this {kind}?',
  [ApprovalDecision.Rejected]: 'Reject this {kind}?',
};

const DECISION_DONE: Record<Decision, string> = {
  [ApprovalDecision.Approved]: '{kind} approved',
  [ApprovalDecision.Rejected]: '{kind} rejected',
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
  const t = useT();

  return async (row, decision) => {
    const ok = await confirm({
      message: DECISION_PROMPT[decision],
      // The kind is an authored label ("Leave request"). Lowered before it is looked up, so
      // English reads as it always did and each language decides its own capitals.
      messageValues: { kind: t(row.kindLabel.toLowerCase()) },
      confirmText: DECISION_VERB[decision],
    });
    if (!ok) return;
    try {
      await decideApproval({ variables: { id: row.id, decision } });
      await refetch();
      notify(DECISION_DONE[decision], 'success', { kind: t(row.kindLabel) });
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not record the decision', 'error');
    }
  };
}
