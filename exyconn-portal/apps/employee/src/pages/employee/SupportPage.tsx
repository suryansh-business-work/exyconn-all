import { useState } from 'react';
import ForumIcon from '@mui/icons-material/Forum';
import { Box, Chip, Text } from '@exyconn/shell/components/ui';
import { DataTable, type Column, type RowAction } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { CrudFormPage } from '@exyconn/shell/components/data/CrudFormPage';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { glass } from '@exyconn/shell/components/glass/glass';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  useMySupportTicketsQuery,
  type MySupportTicketsQuery,
} from '@exyconn/shell/graphql/generated';
import { SupportTicketForm } from './forms/support-ticket';
import { SupportThread } from './SupportThread';

type TicketRow = MySupportTicketsQuery['mySupportTickets'][number];

/** Employee self-service: raise support tickets and track their status. */
export function SupportPage() {
  const { data, loading, refetch } = useMySupportTicketsQuery({ fetchPolicy: 'cache-and-network' });
  const { formatDate } = useSettings();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<TicketRow | null>(null);

  const rows = data?.mySupportTickets ?? [];

  const columns: Column<TicketRow>[] = [
    {
      key: 'reference',
      label: 'Reference',
      render: (r) => <Text size="sm">{r.reference || '—'}</Text>,
    },
    {
      key: 'subject',
      label: 'Subject',
      render: (r) => <Text weight="medium">{r.subject}</Text>,
    },
    {
      key: 'category',
      label: 'Category',
      render: (r) => <Chip size="small" label={r.category} />,
    },
    { key: 'priority', label: 'Priority', render: (r) => <StatusChip value={r.priority} /> },
    { key: 'status', label: 'Status', render: (r) => <StatusChip value={r.status} /> },
    { key: 'createdAt', label: 'Raised', render: (r) => formatDate(r.createdAt) },
  ];

  const actions: RowAction<TicketRow>[] = [
    {
      icon: <ForumIcon fontSize="small" />,
      tooltip: 'Open conversation',
      ariaLabel: 'open ticket',
      color: 'primary',
      onClick: setActive,
    },
  ];

  const close = () => setOpen(false);
  const closeThread = () => setActive(null);

  if (open) {
    return (
      <CrudFormPage title="Raise ticket" onBack={close} backLabel="Back to Support">
        <SupportTicketForm
          onCancel={close}
          onDone={() => {
            void refetch();
            close();
          }}
        />
      </CrudFormPage>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Support"
        subtitle="Raise and track your support tickets"
        actionLabel="Raise ticket"
        onAction={() => setOpen(true)}
      />
      <Box sx={[glass, { p: { xs: 1, md: 1.5 } }]}>
        <DataTable
          columns={columns}
          rows={rows}
          actions={actions}
          emptyMessage={loading ? 'Loading…' : 'You have no support tickets yet.'}
        />
      </Box>
      <CrudDialog open={active !== null} title={active?.subject ?? ''} onClose={closeThread}>
        {active && (
          <SupportThread
            ticketId={active.id}
            description={active.description}
            attachments={active.attachments}
            onClose={closeThread}
          />
        )}
      </CrudDialog>
    </Box>
  );
}
