import { Box, Heading } from '@exyconn/shell/components/ui';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { glass } from '@exyconn/shell/components/glass/glass';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { RequestStatus, useTeamRequestsQuery } from '@exyconn/shell/graphql/generated';
import { decisionActions } from './decision-actions';
import { useRequestDecision } from './useRequestDecision';
import type { TeamRequestRow, TeamSectionProps } from './team.types';

/** WFH, regularisation and other requests the team has raised. */
export function TeamRequestsSection({ nameOf }: Readonly<TeamSectionProps>) {
  const { data, loading, refetch } = useTeamRequestsQuery({ fetchPolicy: 'cache-and-network' });
  const { formatDate } = useSettings();
  const decide = useRequestDecision(refetch);
  const rows = data?.teamRequests ?? [];

  const columns: Column<TeamRequestRow>[] = [
    { key: 'employee', label: 'Employee', render: (r) => nameOf(r.employeeId) },
    { key: 'type', label: 'Type', render: (r) => <StatusChip value={r.type} /> },
    { key: 'subject', label: 'Subject' },
    { key: 'details', label: 'Details' },
    { key: 'createdAt', label: 'Raised', render: (r) => formatDate(r.createdAt) },
    { key: 'status', label: 'Status', render: (r) => <StatusChip value={r.status} /> },
  ];

  return (
    <Box sx={[glass, { p: { xs: 1, md: 1.5 } }]}>
      <Heading level={6} sx={{ px: 1, pt: 0.5 }}>
        Requests
      </Heading>
      <DataTable
        columns={columns}
        rows={rows}
        actions={decisionActions<TeamRequestRow>(
          (row) => decide(row, RequestStatus.Approved),
          (row) => decide(row, RequestStatus.Rejected),
        )}
        emptyMessage="No requests from your team."
        loading={loading}
        onRefresh={refetch}
      />
    </Box>
  );
}
