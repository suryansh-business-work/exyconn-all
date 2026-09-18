import { isValidObjectId } from 'mongoose';
import { actorNameOf } from '../../lib/actor';
import { badRequest, notFound } from '../../utils/errors';
import { withId } from '../../utils/serialize';
import type { GraphQLContext } from '../../middleware/auth';
import { SUPPORT_CLOSED_STATUSES, SupportTicketModel } from '../employee/support.model';
import { notifyBestEffort } from '../notifications/notifications.service';
import { SupportReplyModel } from './support-reply.model';
import { dueAtForPriority } from './sla.service';
import { IT_CATEGORY, type TicketScope } from './desk';

/** An escalated ticket is urgent by definition. */
const ESCALATED_PRIORITY = 'HIGH';

/** Where the assignee opens the ticket: IT's helpdesk for an IT ticket, the console otherwise. */
const ticketLink = (id: string, category: string) =>
  category === IT_CATEGORY ? `/it/helpdesk/${id}` : `/support/tickets/${id}`;

/**
 * Escalates a ticket: it becomes HIGH priority with the deadline that priority promises, its
 * escalation level goes up by one, the reason is kept on the thread as an internal note, and
 * whoever holds it is told. A finished ticket cannot be escalated — reopen it first.
 */
export async function escalateTicket(
  id: string,
  reason: string,
  scope: TicketScope,
  ctx: GraphQLContext,
) {
  const why = reason.trim();
  if (!why) {
    badRequest('Say why the ticket is being escalated.');
  }
  const ticket = isValidObjectId(id)
    ? await SupportTicketModel.findOne({ _id: id, ...scope }).lean()
    : null;
  if (!ticket) {
    notFound('SupportTicket');
  }
  if (SUPPORT_CLOSED_STATUSES.has(ticket.status)) {
    badRequest('Reopen the ticket before escalating it.');
  }
  const level = (ticket.escalationLevel ?? 0) + 1;
  const updated = await SupportTicketModel.findByIdAndUpdate(
    id,
    {
      priority: ESCALATED_PRIORITY,
      dueAt: await dueAtForPriority(ESCALATED_PRIORITY, ticket.createdAt),
      escalationLevel: level,
      escalatedAt: new Date(),
    },
    { new: true },
  ).lean();
  if (!updated) {
    notFound('SupportTicket');
  }
  const authorName = await actorNameOf(ctx);
  await SupportReplyModel.create({
    ticketId: id,
    authorId: ctx.user?.id ?? '',
    authorName,
    body: `Escalated to level ${level}: ${why}`,
    internal: true,
  });
  if (ticket.assigneeId) {
    await notifyBestEffort(ticket.assigneeId, {
      kind: 'SUPPORT',
      title: `Ticket escalated: ${ticket.subject}`,
      body: why,
      link: ticketLink(id, ticket.category),
    });
  }
  return withId(updated);
}
