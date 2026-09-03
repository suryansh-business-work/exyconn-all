import { useState } from 'react';
import { Divider, Stack, Text } from '@exyconn/shell/components/ui';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { TicketAssignee } from './TicketAssignee';
import { TicketThread } from './TicketThread';
import { SupportReplyForm } from './forms/support-reply';

export interface DetailTicket {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  assigneeId: string;
  employeeName?: string | null;
}

interface TicketDetailDialogProps {
  ticket: DetailTicket | null;
  onClose: () => void;
  onChanged: () => void;
}

/** One ticket in full: what was asked, who owns it, and the conversation so far. */
export function TicketDetailDialog({
  ticket,
  onClose,
  onChanged,
}: Readonly<TicketDetailDialogProps>) {
  // Bumped after a reply so the thread refetches without remounting the dialog.
  const [threadKey, setThreadKey] = useState(0);

  if (!ticket) {
    return null;
  }

  return (
    <CrudDialog open title={ticket.subject} onClose={onClose}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={1} alignItems="center">
          <StatusChip value={ticket.status} />
          <StatusChip value={ticket.priority} />
          <Text size="sm" color="text.secondary">
            Raised by {ticket.employeeName ?? 'an employee'}
          </Text>
        </Stack>

        <Text size="sm" sx={{ whiteSpace: 'pre-wrap' }}>
          {ticket.description}
        </Text>

        <TicketAssignee
          ticketId={ticket.id}
          assigneeId={ticket.assigneeId}
          onAssigned={onChanged}
        />

        <Divider />
        <TicketThread key={threadKey} ticketId={ticket.id} />

        <Divider />
        <SupportReplyForm
          ticketId={ticket.id}
          onCancel={onClose}
          onDone={() => {
            setThreadKey((key) => key + 1);
            onChanged();
          }}
        />
      </Stack>
    </CrudDialog>
  );
}
