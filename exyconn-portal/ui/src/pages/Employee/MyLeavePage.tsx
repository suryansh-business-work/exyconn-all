import { useState } from 'react';
import { Box } from '@/components/ui';
import { DataTable, type Column } from '@/components/data/DataTable';
import { StatusChip } from '@/components/data/StatusChip';
import { CrudDialog } from '@/components/data/CrudDialog';
import { PageHeader } from '@/components/layout/PageHeader';
import { glass } from '@/components/glass/glass';
import { useSettings } from '@/hooks/useSettings';
import { useMyLeaveRequestsQuery } from '@/graphql/generated';
import { ApplyLeaveForm } from './forms/apply-leave';

type LeaveRow = {
  id: string;
  type: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: string;
};

/** Employee self-service: apply for leave and track your own requests. */
export function MyLeavePage() {
  const { data, loading, refetch } = useMyLeaveRequestsQuery({ fetchPolicy: 'cache-and-network' });
  const { formatDate } = useSettings();
  const [open, setOpen] = useState(false);

  const rows = (data?.myLeaveRequests ?? []) as LeaveRow[];

  const columns: Column<LeaveRow>[] = [
    { key: 'type', label: 'Type', render: (r) => <StatusChip value={r.type} /> },
    { key: 'fromDate', label: 'From', render: (r) => formatDate(r.fromDate) },
    { key: 'toDate', label: 'To', render: (r) => formatDate(r.toDate) },
    { key: 'reason', label: 'Reason' },
    { key: 'status', label: 'Status', render: (r) => <StatusChip value={r.status} /> },
  ];

  return (
    <Box>
      <PageHeader
        title="My Leave"
        subtitle="Apply for leave and track approvals"
        actionLabel="Apply for leave"
        onAction={() => setOpen(true)}
      />
      <Box sx={[glass, { p: { xs: 1, md: 1.5 } }]}>
        <DataTable
          columns={columns}
          rows={rows}
          emptyMessage={loading ? 'Loading…' : 'You have no leave requests yet.'}
        />
      </Box>
      <CrudDialog open={open} title="Apply for leave" onClose={() => setOpen(false)}>
        <ApplyLeaveForm
          onCancel={() => setOpen(false)}
          onDone={() => {
            void refetch();
            setOpen(false);
          }}
        />
      </CrudDialog>
    </Box>
  );
}
