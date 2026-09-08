import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { RequestStatus, useDecideEmployeeRequestMutation } from '@exyconn/shell/graphql/generated';

type RequestDecision = RequestStatus.Approved | RequestStatus.Rejected;

const VERB: Record<RequestDecision, string> = {
  [RequestStatus.Approved]: 'Approve',
  [RequestStatus.Rejected]: 'Reject',
};

/** Confirms, then records the manager's decision through `decideEmployeeRequest`. */
export function useRequestDecision(refetch: () => Promise<unknown>) {
  const [decide] = useDecideEmployeeRequestMutation();
  const confirm = useConfirm();
  const notify = useNotify();

  return async (row: { id: string; subject: string }, status: RequestDecision) => {
    const verb = VERB[status];
    const ok = await confirm({ message: `${verb} “${row.subject}”?`, confirmText: verb });
    if (!ok) return;
    try {
      await decide({ variables: { id: row.id, status } });
      await refetch();
      notify(`Request ${status.toLowerCase()}`);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not update the request', 'error');
    }
  };
}
