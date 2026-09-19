import { emitWebhookBestEffort } from '../integrations';

/** The stored fields an integration is told about when a ticket is filed. */
interface FiledTicket {
  _id: unknown;
  reference: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  channel: string;
  requesterType: string;
  requesterName?: string;
  requesterEmail?: string;
  clientId?: string;
  clientName?: string;
  dueAt?: Date | null;
}

/**
 * Announces a new ticket, whichever door it came in at.
 *
 * Both filing paths call this — the customer funnel and an employee raising one — so an
 * integration that pages an on-call engineer sees the same event shape for a mail that
 * landed in the support mailbox and a form somebody filled in on the portal.
 */
export function announceTicketFiled(ticket: FiledTicket): void {
  emitWebhookBestEffort('ticket.created', {
    ticketId: String(ticket._id),
    reference: ticket.reference,
    subject: ticket.subject,
    category: ticket.category,
    priority: ticket.priority,
    status: ticket.status,
    channel: ticket.channel,
    requesterType: ticket.requesterType,
    requesterName: ticket.requesterName ?? '',
    requesterEmail: ticket.requesterEmail ?? '',
    clientId: ticket.clientId ?? '',
    clientName: ticket.clientName ?? '',
    dueAt: ticket.dueAt ? ticket.dueAt.toISOString() : '',
  });
}
