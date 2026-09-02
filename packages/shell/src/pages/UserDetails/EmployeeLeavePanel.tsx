import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { Box, Heading } from '@/components/ui';
import { DataTable, type Column, type RowAction } from '@/components/data/DataTable';
import { StatusChip } from '@/components/data/StatusChip';
import { glass } from '@/components/glass/glass';
import { useConfirm } from '@/components/feedback/ConfirmProvider';
import { useNotify } from '@/components/feedback/NotificationProvider';
import { useSettings } from '@/hooks/useSettings';
import {
  LeaveStatus,
  useLeaveRequestsByEmployeeQuery,
  useSetLeaveStatusMutation,
} from '@/graphql/generated';

type LeaveRow = {
  id: string;
  type: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: string;
};

/** HR/ADMIN panel: an employee's leave requests with approve/reject actions. */
export function EmployeeLeavePanel({ employeeId }: { employeeId: string }) {
  const { data, loading, refetch } = useLeaveRequestsByEmployeeQuery({
    variables: { employeeId },
    fetchPolicy: 'cache-and-network',
  });
  const [setStatus] = useSetLeaveStatusMutation();
  const confirm = useConfirm();
  const notify = useNotify();
  const { formatDate } = useSettings();

  const rows = (data?.leaveRequestsByEmployee ?? []) as LeaveRow[];

  const decide = async (row: LeaveRow, status: LeaveStatus) => {
    const ok = await confirm({
      message: `${status === LeaveStatus.Approved ? 'Approve' : 'Reject'} this leave request?`,
      confirmText: status === LeaveStatus.Approved ? 'Approve' : 'Reject',
    });
    if (!ok) return;
    await setStatus({ variables: { id: row.id, status } });
    await refetch();
    notify(`Leave ${status.toLowerCase()}`);
  };

  const actions: RowAction<LeaveRow>[] = [
    {
      icon: <CheckIcon fontSize="small" />,
      tooltip: 'Approve',
      ariaLabel: 'approve leave',
      color: 'success',
      onClick: (r) => decide(r, LeaveStatus.Approved),
    },
    {
      icon: <CloseIcon fontSize="small" />,
      tooltip: 'Reject',
      ariaLabel: 'reject leave',
      color: 'error',
      onClick: (r) => decide(r, LeaveStatus.Rejected),
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
    <Box sx={[glass, { p: { xs: 1.5, md: 2 } }]}>
      <Heading level={6} sx={{ mb: 1 }}>
        Leave requests
      </Heading>
      <DataTable
        columns={columns}
        rows={rows}
        actions={actions}
        emptyMessage={loading ? 'Loading…' : 'No leave requests.'}
      />
    </Box>
  );
}
