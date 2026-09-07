import type { MouseEvent } from 'react';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { Flex, IconButton, Tooltip } from '@exyconn/shell/components/ui';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { LeaveStatus, useSetLeaveStatusMutation } from '@exyconn/shell/graphql/generated';
import type { LeaveRequestRow } from './forms/leave-request';

/** Where a pending request can go. */
export type LeaveDecision = LeaveStatus.Approved | LeaveStatus.Rejected;
type Decide = (row: LeaveRequestRow, status: LeaveDecision) => void;

const VERB: Record<LeaveDecision, string> = {
  [LeaveStatus.Approved]: 'Approve',
  [LeaveStatus.Rejected]: 'Reject',
};

/**
 * Confirms, then moves the request through `setLeaveStatus` — the same mutation the
 * employee record's leave panel uses, so the balance debit and the employee's
 * notification happen once, on the server, whichever screen HR decides from.
 */
export function useLeaveDecision(refetch: () => Promise<unknown>): Decide {
  const [setStatus] = useSetLeaveStatusMutation();
  const confirm = useConfirm();
  const notify = useNotify();

  return async (row, status) => {
    const verb = VERB[status];
    const ok = await confirm({ message: `${verb} this leave request?`, confirmText: verb });
    if (!ok) return;
    try {
      await setStatus({ variables: { id: row.id, status } });
      await refetch();
      notify(`Leave ${status.toLowerCase()}`);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not update the leave request', 'error');
    }
  };
}

interface LeaveDecisionCellProps {
  row: LeaveRequestRow;
  onDecide: Decide;
}

/** Approve / reject buttons; only a pending request has anything to decide. */
export function LeaveDecisionCell({ row, onDecide }: Readonly<LeaveDecisionCellProps>) {
  if (row.status !== LeaveStatus.Pending) return null;
  // The row itself navigates to the employee, which a decision click must not do.
  const decide = (status: LeaveDecision) => (event: MouseEvent) => {
    event.stopPropagation();
    onDecide(row, status);
  };
  return (
    <Flex direction="row" spacing={0.25}>
      <Tooltip title="Approve">
        <IconButton
          size="small"
          color="success"
          aria-label="approve leave"
          onClick={decide(LeaveStatus.Approved)}
        >
          <CheckIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Reject">
        <IconButton
          size="small"
          color="error"
          aria-label="reject leave"
          onClick={decide(LeaveStatus.Rejected)}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Flex>
  );
}
