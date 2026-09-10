import { useState } from 'react';
import { Divider, Stack, Text } from '@exyconn/shell/components/ui';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { AttachmentList, type AttachmentItem } from '@exyconn/shell/components/upload';
import { TicketAssignee } from './TicketAssignee';
import { TicketThread } from './TicketThread';
import { TicketTriage } from './TicketTriage';
import { SupportReplyForm } from './forms/support-reply';

/** Everything the detail view renders, whether it is in a drawer or on its own page. */
export interface DetailTicket {
  id: string;
  reference: string;
  subject: string;
  description: string;
  status: string;
  category: string;
  priority: string;
  slaState: string;
  assigneeId: string;
  requesterType: string;
  clientName: string;
  requesterName: string;
  requesterEmail: string;
  employeeName?: string | null;
  attachments: readonly AttachmentItem[];
}

/** Who to say the ticket came from, in the words the agent would use on the phone. */
function requesterLabel(ticket: DetailTicket): string {
  if (ticket.requesterType === 'CLIENT') {
    const who = ticket.clientName || ticket.requesterName || 'a customer';
    return ticket.requesterEmail ? `${who} (${ticket.requesterEmail})` : who;
  }
  return ticket.employeeName ?? 'an employee';
}

interface TicketDetailBodyProps {
  ticket: DetailTicket;
  /** Refetches whatever is showing the ticket — the grid, or the page's own query. */
  onChanged: () => void;
  /** What Cancel on the reply box does: close the drawer, or go back to the queue. */
  onCancel: () => void;
}

/**
 * One ticket in full: what was asked, who owns it, and the conversation so far.
 *
 * Shared by the drawer the grid opens and the `/support/tickets/:id` page an email links
 * to, so the two can never drift into showing different things about the same ticket.
 */
export function TicketDetailBody({ ticket, onChanged, onCancel }: Readonly<TicketDetailBodyProps>) {
  // Bumped after a reply so the thread refetches without remounting the whole view.
  const [threadKey, setThreadKey] = useState(0);

  return (
    <Stack spacing={2}>
      <Stack
        direction="row"
        spacing={1}
        sx={{
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <StatusChip value={ticket.status} />
        <StatusChip value={ticket.priority} />
        <StatusChip value={ticket.slaState} />
        <Text size="sm" color="text.secondary">
          {ticket.reference} · Raised by {requesterLabel(ticket)}
        </Text>
      </Stack>

      <Text size="sm" sx={{ whiteSpace: 'pre-wrap' }}>
        {ticket.description}
      </Text>
      <AttachmentList items={ticket.attachments} />

      <TicketTriage
        ticketId={ticket.id}
        category={ticket.category}
        priority={ticket.priority}
        onChanged={onChanged}
      />
      <TicketAssignee ticketId={ticket.id} assigneeId={ticket.assigneeId} onAssigned={onChanged} />

      <Divider />
      <TicketThread key={threadKey} ticketId={ticket.id} />

      <Divider />
      <SupportReplyForm
        ticketId={ticket.id}
        onCancel={onCancel}
        onDone={() => {
          setThreadKey((key) => key + 1);
          onChanged();
        }}
      />
    </Stack>
  );
}
