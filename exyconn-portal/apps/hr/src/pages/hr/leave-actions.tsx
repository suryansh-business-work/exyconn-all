import type { MouseEvent } from 'react';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { Flex, IconButton, Tooltip } from '@exyconn/shell/components/ui';
import { LeaveStatus } from '@exyconn/shell/graphql/generated';
import type { DecideLeave, LeaveDecision } from '@exyconn/shell/hooks/useLeaveDecision';
import type { LeaveRequestRow } from './forms/leave-request';

export { useLeaveDecision } from '@exyconn/shell/hooks/useLeaveDecision';

interface LeaveDecisionCellProps {
  row: LeaveRequestRow;
  onDecide: DecideLeave;
}

/** Approve / reject buttons; only a pending request has anything to decide. */
export function LeaveDecisionCell({ row, onDecide }: Readonly<LeaveDecisionCellProps>) {
  if (row.status !== LeaveStatus.Pending) return null;
  // The row itself navigates to the employee, which a decision click must not do.
  const decide = (status: LeaveDecision) => (event: MouseEvent) => {
    event.stopPropagation();
    onDecide(row, status).catch(() => undefined);
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
