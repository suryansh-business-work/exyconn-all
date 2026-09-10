import { slaState, type SlaState } from './support.sla';
import type { Attachment } from './attachment.schema';

interface TicketRow {
  createdAt: Date;
  requesterType?: string | null;
  channel?: string | null;
  reference?: string | null;
  clientId?: string | null;
  clientName?: string | null;
  requesterName?: string | null;
  requesterEmail?: string | null;
  attachments?: Attachment[] | null;
  dueAt?: Date | null;
  resolvedAt?: Date | null;
}

/**
 * Fields a ticket written before the support desk grew them comes back without.
 *
 * Every one of these is non-null in the schema, so a `.lean()` row from before the
 * migration would break the query rather than read as "not set" — which is why they are
 * defaulted here instead of being back-filled: no migration can be forgotten, and an
 * employee ticket that predates `requesterType` is exactly what EMPLOYEE means.
 */
export const supportTicketFields = {
  requesterType: (ticket: TicketRow) => ticket.requesterType ?? 'EMPLOYEE',
  channel: (ticket: TicketRow) => ticket.channel ?? 'PORTAL',
  reference: (ticket: TicketRow) => ticket.reference ?? '',
  clientId: (ticket: TicketRow) => ticket.clientId ?? '',
  clientName: (ticket: TicketRow) => ticket.clientName ?? '',
  requesterName: (ticket: TicketRow) => ticket.requesterName ?? '',
  requesterEmail: (ticket: TicketRow) => ticket.requesterEmail ?? '',
  attachments: (ticket: TicketRow) => ticket.attachments ?? [],
  /** Derived, never stored: the state has to follow the clock, not the last write. */
  slaState: (ticket: TicketRow): SlaState => slaState(ticket, new Date()),
};

export const supportReplyFields = {
  attachments: (reply: { attachments?: Attachment[] | null }) => reply.attachments ?? [],
};
