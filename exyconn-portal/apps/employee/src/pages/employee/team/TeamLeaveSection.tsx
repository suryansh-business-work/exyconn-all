import { Box, Heading } from '@exyconn/shell/components/ui';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { glass } from '@exyconn/shell/components/glass/glass';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { useLeaveDecision } from '@exyconn/shell/hooks/useLeaveDecision';
import { LeaveStatus, useTeamLeaveRequestsQuery } from '@exyconn/shell/graphql/generated';
import { decisionActions } from './decision-actions';
import type { TeamLeaveRow, TeamSectionProps } from './team.types';

/** Leave the team has asked for. Approval runs the balance-aware `setLeaveStatus`. */
export function TeamLeaveSection({ nameOf }: Readonly<TeamSectionProps>) {
  const { data, loading, refetch } = useTeamLeaveRequestsQuery({
    fetchPolicy: 'cache-and-network',
  });
  const { formatDate } = useSettings();
  const decide = useLeaveDecision(refetch);
  const rows = data?.teamLeaveRequests ?? [];

  const columns: Column<TeamLeaveRow>[] = [
    { key: 'employee', label: 'Employee', render: (r) => nameOf(r.employeeId) },
    { key: 'type', label: 'Type', render: (r) => <StatusChip value={r.type} /> },
    { key: 'fromDate', label: 'From', render: (r) => formatDate(r.fromDate) },
    { key: 'toDate', label: 'To', render: (r) => formatDate(r.toDate) },
    { key: 'reason', label: 'Reason' },
    { key: 'status', label: 'Status', render: (r) => <StatusChip value={r.status} /> },
  ];

  return (
    <Box sx={[glass, { p: { xs: 1, md: 1.5 } }]}>
      <Heading level={6} sx={{ px: 1, pt: 0.5 }}>
        Leave requests
      </Heading>
      <DataTable
        columns={columns}
        rows={rows}
        actions={decisionActions<TeamLeaveRow>(
          (row) => decide(row, LeaveStatus.Approved),
          (row) => decide(row, LeaveStatus.Rejected),
        )}
        emptyMessage="No leave requests from your team."
        loading={loading}
        onRefresh={refetch}
      />
    </Box>
  );
}
