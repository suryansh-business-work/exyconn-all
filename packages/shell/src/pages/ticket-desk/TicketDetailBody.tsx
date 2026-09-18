import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import { Divider, Stack, Text } from '@/components/ui';
import { StatusChip } from '@/components/data/StatusChip';
import { AttachmentList, type AttachmentItem } from '@/components/upload';
import { TicketAssignee } from './TicketAssignee';
import { TicketThread } from './TicketThread';
import { TicketTriage } from './TicketTriage';
import { TicketEscalate } from './TicketEscalate';
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
  topic: string;
  escalationLevel: number;
  escalatedAt?: string | null;
  assigneeId: string;
  requesterType: string;
  clientName: string;
  requesterName: string;
  requesterEmail: string;
  employeeName?: string | null;
  attachments: readonly AttachmentItem[];
}

/** Who to say the ticket came from, in the words the agent would use on the phone. */
function requesterLabel(ticket: DetailTicket, t: (source: string) => string): string {
  if (ticket.requesterType === 'CLIENT') {
    const who = ticket.clientName || ticket.requesterName || t('a customer');
    return ticket.requesterEmail ? `${who} (${ticket.requesterEmail})` : who;
  }
  return ticket.employeeName ?? t('an employee');
}

interface TicketDetailBodyProps {
  ticket: DetailTicket;
  /** Refetches whatever is showing the ticket — the grid, or the page's own query. */
  onChanged: () => void;
  /** What Cancel on the reply box does: close the drawer, or go back to the queue. */
  onCancel: () => void;
  /** The desk's ticket topics (IT's). Omit for a desk that does not triage by topic. */
  topics?: readonly string[];
}

/** A resolved or closed ticket is finished — it has to be reopened before it is escalated. */
const FINISHED = new Set(['RESOLVED', 'CLOSED']);

/**
 * One ticket in full: what was asked, who owns it, and the conversation so far.
 *
 * Shared by the drawer the grid opens and the ticket page an email links to — in the Support
 * console and in IT's helpdesk — so no two of them can drift into showing different things
 * about the same ticket.
 */
export function TicketDetailBody({
  ticket,
  onChanged,
  onCancel,
  topics,
}: Readonly<TicketDetailBodyProps>) {
  const t = useT();
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
          {t('{reference} · Raised by {requester}', {
            reference: ticket.reference,
            requester: requesterLabel(ticket, t),
          })}
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
        topic={ticket.topic}
        topics={topics}
        onChanged={onChanged}
      />
      <TicketAssignee
        ticketId={ticket.id}
        assigneeId={ticket.assigneeId}
        category={ticket.category}
        onAssigned={onChanged}
      />
      <TicketEscalate
        ticketId={ticket.id}
        escalationLevel={ticket.escalationLevel}
        escalatedAt={ticket.escalatedAt}
        closed={FINISHED.has(ticket.status)}
        onEscalated={() => {
          setThreadKey((key) => key + 1);
          onChanged();
        }}
      />

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
