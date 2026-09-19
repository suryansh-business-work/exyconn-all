import type { MouseEvent } from 'react';
import { useT } from '@exyconn/i18n';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { Flex, IconButton, Text, Tooltip } from '@exyconn/shell/components/ui';
import { useAuth } from '@exyconn/shell/auth/AuthContext';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
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
  const t = useT();
  const { user } = useAuth();
  if (row.status !== LeaveStatus.Pending) return null;
  // Nobody decides their own leave; the server refuses it, so the buttons would only fail.
  if (user?.id === row.employeeId) {
    return (
      <Text size="sm" color="text.secondary">
        {t('HR or your manager decides')}
      </Text>
    );
  }
  // The row itself navigates to the employee, which a decision click must not do.
  const decide = (status: LeaveDecision) => (event: MouseEvent) => {
    event.stopPropagation();
    onDecide(row, status).catch((error: unknown) =>
      portalLogger.error('Deciding a leave request failed', error),
    );
  };
  return (
    <Flex direction="row" spacing={0.5}>
      <Tooltip title={t('Approve')}>
        <IconButton
          size="small"
          color="success"
          aria-label={t('approve leave')}
          onClick={decide(LeaveStatus.Approved)}
        >
          <CheckIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title={t('Reject')}>
        <IconButton
          size="small"
          color="error"
          aria-label={t('reject leave')}
          onClick={decide(LeaveStatus.Rejected)}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Flex>
  );
}
