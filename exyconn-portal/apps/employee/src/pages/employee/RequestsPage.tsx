import { useState } from 'react';
import { Box, Button, Flex, Text } from '@exyconn/shell/components/ui';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { glass } from '@exyconn/shell/components/glass/glass';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { useMyRequestsQuery } from '@exyconn/shell/graphql/generated';
import { RaiseRequestForm, type MyRequestRow } from './forms/raise-request';

/** Employee self-service: every HR request this employee has raised, and its outcome. */
export function RequestsPage() {
  const { data, loading, refetch } = useMyRequestsQuery({ fetchPolicy: 'cache-and-network' });
  const { formatDate } = useSettings();
  const [open, setOpen] = useState(false);
  const rows = (data?.myRequests ?? []) as MyRequestRow[];

  const columns: Column<MyRequestRow>[] = [
    { key: 'subject', label: 'Subject', render: (r) => <Text weight="medium">{r.subject}</Text> },
    { key: 'type', label: 'Type', render: (r) => <StatusChip value={r.type} /> },
    { key: 'details', label: 'Details', render: (r) => r.details },
    { key: 'status', label: 'Status', render: (r) => <StatusChip value={r.status} /> },
    { key: 'createdAt', label: 'Raised', render: (r) => formatDate(r.createdAt) },
    { key: 'decisionNote', label: 'HR note', render: (r) => r.decisionNote ?? '—' },
  ];

  return (
    <Box>
      <Flex direction="row" justifyContent="space-between" alignItems="center">
        <PageHeader title="My Requests" subtitle="WFH, regularisation, documents and more" />
        <Button onClick={() => setOpen(true)}>Raise request</Button>
      </Flex>

      <Box sx={[glass, { p: { xs: 1, md: 1.5 } }]}>
        <DataTable
          columns={columns}
          rows={rows}
          emptyMessage={loading ? 'Loading…' : 'You have not raised any requests yet.'}
        />
      </Box>

      <CrudDialog open={open} title="Raise a request" onClose={() => setOpen(false)}>
        <RaiseRequestForm
          onCancel={() => setOpen(false)}
          onDone={async () => {
            setOpen(false);
            await refetch();
          }}
        />
      </CrudDialog>
    </Box>
  );
}
