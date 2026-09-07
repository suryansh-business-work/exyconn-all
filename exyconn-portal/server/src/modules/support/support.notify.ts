import { UserModel } from '../admin/user.model';
import { emailer } from '../email';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';

/** The template a public reply is emailed with. Authored in Tech → Email. */
export const SUPPORT_REPLY_TEMPLATE = 'support-reply';

interface RepliedTicket {
  _id: unknown;
  employeeId: string;
  subject: string;
}

/**
 * Tells the employee their ticket has an answer.
 *
 * Best-effort on purpose: the reply is already saved, and a mail server that is down
 * must not make the agent believe the reply was lost. The failure is logged and the
 * reply stands. Internal notes never reach this function.
 */
export async function notifyEmployeeOfReply(
  ticket: RepliedTicket,
  replyBody: string,
): Promise<void> {
  try {
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
  } catch (error) {
    logger.error({ err: error }, `Support reply email for ticket ${String(ticket._id)} failed`);
  }
}
