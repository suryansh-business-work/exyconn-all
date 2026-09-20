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
export const ticketLink = (id: string, category: string) =>
  category === IT_CATEGORY ? `/it/helpdesk/${id}` : `/support/tickets/${id}`;

/**
 * Whoever an escalation is attributed to on the thread: a signed-in agent, or the SLA
 * sweep when the deadline escalated it with nobody watching.
 */
export interface EscalationActor {
  /** Empty for the sweep — no account did it. */
  id: string;
  name: string;
}

/** The fields an escalation reads off the ticket it is about to raise. */
interface EscalatableTicket {
  _id: unknown;
  subject: string;
  category: string;
  createdAt: Date;
  assigneeId?: string | null;
  escalationLevel?: number | null;
}

/**
 * The escalation itself, with no opinion about who asked for it.
 *
 * Split out from the mutation so the SLA sweep escalates a breached ticket by exactly the
 * same steps an agent does — same priority, same recomputed deadline, same internal note on
 * the thread, same notification to whoever holds it. A second implementation for the
 * automatic path would be a second set of rules to keep in step, and the thread is the
 * record people read months later: it has to say the same thing whichever raised it.
 */
export async function applyEscalation(
  ticket: EscalatableTicket,
  why: string,
  actor: EscalationActor,
) {
  const id = String(ticket._id);
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
  await SupportReplyModel.create({
    ticketId: id,
    authorId: actor.id,
    authorName: actor.name,
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
  return applyEscalation(ticket, why, { id: ctx.user?.id ?? '', name: await actorNameOf(ctx) });
}
