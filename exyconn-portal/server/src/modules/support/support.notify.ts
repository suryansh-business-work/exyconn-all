import { UserModel } from '../admin/user.model';
import { emailer } from '../email';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';

/** The template a public reply to an employee is emailed with. Authored in Tech → Email. */
export const SUPPORT_REPLY_TEMPLATE = 'support-reply';
/** The same for a customer: they have no portal, so the mail carries the reference. */
export const SUPPORT_REPLY_CLIENT_TEMPLATE = 'support-reply-client';

interface RepliedTicket {
  _id: unknown;
  employeeId: string;
  subject: string;
  requesterType?: string | null;
  requesterName?: string | null;
  requesterEmail?: string | null;
  reference?: string | null;
}

/** Tells the employee who raised the ticket that it has an answer. */
async function emailEmployee(ticket: RepliedTicket, replyBody: string): Promise<void> {
  const employee = await UserModel.findById(ticket.employeeId).select('name email').lean();
  if (!employee?.email) {
    logger.warn(`Support reply on ticket ${String(ticket._id)}: employee has no email`);
    return;
  }
  await emailer.send({
    template: SUPPORT_REPLY_TEMPLATE,
    to: employee.email,
    variables: {
      employeeName: employee.name || employee.email,
      ticketSubject: ticket.subject,
      replyBody,
      link: env.employeeSupportUrl,
    },
    triggeredBy: 'support console',
  });
}

/**
 * Tells the customer their ticket has an answer. There is no account to look up — the
 * address they wrote in with is the address that is written back to.
 */
async function emailClient(ticket: RepliedTicket, replyBody: string): Promise<void> {
  const to = ticket.requesterEmail ?? '';
  if (!to) {
    logger.warn(`Support reply on ticket ${String(ticket._id)}: customer has no email`);
    return;
  }
  await emailer.send({
    template: SUPPORT_REPLY_CLIENT_TEMPLATE,
    to,
    variables: {
      name: ticket.requesterName || to,
      ticketSubject: ticket.subject,
      replyBody,
      reference: ticket.reference ?? '',
    },
    triggeredBy: 'support console',
  });
}

/**
 * Tells whoever raised the ticket that it has an answer, by whichever route they have:
 * the portal for an employee, plain email for a customer.
 *
 * Best-effort on purpose: the reply is already saved, and a mail server that is down
 * must not make the agent believe the reply was lost. The failure is logged and the
 * reply stands. Internal notes never reach this function.
 */
export async function notifyRequesterOfReply(
  ticket: RepliedTicket,
  replyBody: string,
): Promise<void> {
  try {
    if (ticket.requesterType === 'CLIENT') {
      await emailClient(ticket, replyBody);
      return;
    }
    await emailEmployee(ticket, replyBody);
  } catch (error) {
    logger.error({ err: error }, `Support reply email for ticket ${String(ticket._id)} failed`);
  }
}
