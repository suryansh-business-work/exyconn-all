import { useState } from 'react';
import { Box, Chip, Text } from '@exyconn/shell/components/ui';
import EditIcon from '@mui/icons-material/Edit';
import ForumIcon from '@mui/icons-material/Forum';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { glass } from '@exyconn/shell/components/glass/glass';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { useListSupportTicketsQuery } from '@exyconn/shell/graphql/generated';
import { TicketStatusDialog, type StatusTicket } from './TicketStatusDialog';
import { TicketDetailDialog, type DetailTicket } from './TicketDetailDialog';

type TicketRow = {
  id: string;
  employeeName?: string | null;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  assigneeId: string;
  assigneeName: string;
  createdAt: string;
};

/**
 * Support-team console: every employee ticket, who owns it, and the conversation
 * on it. Status changes stay in their own small dialog; opening a ticket is the
 * fuller view.
 */
export function SupportConsolePage() {
  const { data, loading, refetch } = useListSupportTicketsQuery({
    fetchPolicy: 'cache-and-network',
  });
  const { formatDate } = useSettings();
  const [selected, setSelected] = useState<StatusTicket | null>(null);
  const [opened, setOpened] = useState<DetailTicket | null>(null);

  const rows = (data?.listSupportTickets ?? []) as TicketRow[];

  const columns: Column<TicketRow>[] = [
    { key: 'employeeName', label: 'Employee', render: (r) => r.employeeName ?? '—' },
    { key: 'subject', label: 'Subject', render: (r) => <Text weight="medium">{r.subject}</Text> },
    { key: 'category', label: 'Category', render: (r) => <Chip size="small" label={r.category} /> },
    { key: 'priority', label: 'Priority', render: (r) => <StatusChip value={r.priority} /> },
    { key: 'status', label: 'Status', render: (r) => <StatusChip value={r.status} /> },
    {
      key: 'assigneeName',
      label: 'Assigned to',
      render: (r) => r.assigneeName || <Text color="text.secondary">Unassigned</Text>,
    },
    { key: 'createdAt', label: 'Raised', render: (r) => formatDate(r.createdAt) },
  ];

  return (
    <Box>
      <PageHeader title="Support" subtitle="Employee support tickets" />
      <Box sx={[glass, { p: { xs: 1, md: 1.5 } }]}>
        <DataTable
          columns={columns}
          rows={rows}
          actions={[
            {
              icon: <ForumIcon fontSize="small" />,
              tooltip: 'Open ticket',
              ariaLabel: 'open ticket',
              color: 'primary',
              onClick: (r) => setOpened(r),
            },
            {
              icon: <EditIcon fontSize="small" />,
              tooltip: 'Update status',
              ariaLabel: 'update status',
              onClick: (r) => setSelected({ id: r.id, subject: r.subject, status: r.status }),
            },
          ]}
          emptyMessage={loading ? 'Loading…' : 'No support tickets yet.'}
        />
      </Box>
      <TicketDetailDialog
        ticket={opened}
        onClose={() => setOpened(null)}
        onChanged={() => {
          void refetch();
        }}
      />
      <TicketStatusDialog
        ticket={selected}
        onClose={() => setSelected(null)}
        onSaved={() => {
          void refetch();
          setSelected(null);
        }}
      />
    </Box>
  );
}
