import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { useT } from '@exyconn/i18n';
import { Box, Heading, Text } from '@/components/ui';
import { DataTable, type Column, type RowAction } from '@/components/data/DataTable';
import { StatusChip } from '@/components/data/StatusChip';

import { useSettings } from '@/hooks/useSettings';
import { LeaveStatus, useLeaveRequestsByEmployeeQuery } from '@/graphql/generated';
import { panel } from '@/components/glass/glass';
import { useAuth } from '@/auth/AuthContext';
import { useLeaveDecision } from '@/hooks/useLeaveDecision';
import { portalLogger } from '@/logging/portalLogger';

type LeaveRow = {
  id: string;
  type: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: string;
};

/** HR/ADMIN panel: an employee's leave requests with approve/reject actions. */
export function EmployeeLeavePanel({ employeeId }: Readonly<{ employeeId: string }>) {
  const t = useT();
  const { data, loading, refetch } = useLeaveRequestsByEmployeeQuery({
    variables: { employeeId },
    fetchPolicy: 'cache-and-network',
  });
  // The shared decision reports a refusal (not enough balance, …) instead of dropping it.
  const decide = useLeaveDecision(refetch);
  const { user } = useAuth();
  const { formatDate } = useSettings();

  const rows = (data?.leaveRequestsByEmployee ?? []) as LeaveRow[];
  // Nobody decides their own leave — HR or their manager does — so it is not offered.
  const ownRecord = user?.id === employeeId;
  const undecidable = (row: LeaveRow) => ownRecord || row.status !== LeaveStatus.Pending;
  const run = (row: LeaveRow, status: LeaveStatus.Approved | LeaveStatus.Rejected) => {
    decide(row, status).catch((error: unknown) =>
      portalLogger.error('Deciding a leave request failed', error),
    );
  };

  const actions: RowAction<LeaveRow>[] = [
    {
      icon: <CheckIcon fontSize="small" />,
      tooltip: 'Approve',
      ariaLabel: 'approve leave',
      color: 'success',
      onClick: (r) => run(r, LeaveStatus.Approved),
      hidden: undecidable,
    },
    {
      icon: <CloseIcon fontSize="small" />,
      tooltip: 'Reject',
      ariaLabel: 'reject leave',
      color: 'error',
      onClick: (r) => run(r, LeaveStatus.Rejected),
      hidden: undecidable,
    },
  ];

  const columns: Column<LeaveRow>[] = [
    { key: 'type', label: 'Type', render: (r) => <StatusChip value={r.type} /> },
    { key: 'fromDate', label: 'From', render: (r) => formatDate(r.fromDate) },
    { key: 'toDate', label: 'To', render: (r) => formatDate(r.toDate) },
    { key: 'reason', label: 'Reason' },
    { key: 'status', label: 'Status', render: (r) => <StatusChip value={r.status} /> },
  ];

  return (
    <Box sx={panel}>
      <Heading level={6} sx={{ mb: 1 }}>
        Leave requests
      </Heading>
      {ownRecord && (
        <Text component="p" size="sm" color="text.secondary" sx={{ mb: 1 }}>
          {t('These are your own requests. HR or your manager approves them — not you.')}
        </Text>
      )}
      <DataTable
        columns={columns}
        rows={rows}
        actions={actions}
        emptyMessage="No leave requests."
        loading={loading}
        onRefresh={refetch}
      />
    </Box>
  );
}
