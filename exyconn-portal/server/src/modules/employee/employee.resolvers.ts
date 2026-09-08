import { SalaryStructureModel } from './salary.model';
import { SalarySlipModel } from './salarySlip.model';
import { HolidayModel } from './holiday.model';
import { SupportTicketModel } from './support.model';
import { SupportReplyModel } from '../support/support-reply.model';
import { toAttachments, type AttachmentInput } from '../support/attachment.schema';
import { dueAtForPriority } from '../support/sla.service';
import { uniqueReference } from '../support/ticket-reference';
import { UserModel } from '../admin/user.model';
import { assertAuthenticated } from '../../middleware/roleGuard';
import { badRequest, notFound } from '../../utils/errors';
import { withId, withIds } from '../../utils/serialize';
import type { GraphQLContext } from '../../middleware/auth';

interface SupportTicketInput {
  subject: string;
  category: string;
  description: string;
  priority: string;
  attachments?: AttachmentInput[] | null;
}

/** Attaches the derived gross/net figures to a salary structure document. */
function withTotals<
  T extends { basic: number; hra: number; allowances: number; deductions: number },
>(doc: T): T & { gross: number; net: number } {
  const gross = doc.basic + doc.hra + doc.allowances;
  return { ...doc, gross, net: gross - doc.deductions };
}

/**
 * A ticket the signed-in employee raised, and nothing else. Somebody else's
 * ticket reads as not found, so the id alone reveals nothing about it.
 */
async function ownTicket(ticketId: string, ctx: GraphQLContext) {
  const user = assertAuthenticated(ctx);
  const ticket = await SupportTicketModel.findById(ticketId).lean();
  if (!ticket || ticket.employeeId !== user.id) notFound('SupportTicket');
  return { ticket, user };
}

/** Employee self-service resolvers — all keyed off the authenticated user. */
export const employeeResolvers = {
  Query: {
    myPayroll: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      const user = assertAuthenticated(ctx);
      const doc = await SalaryStructureModel.findOne({ employeeId: user.id }).lean();
      return doc ? withId(withTotals(doc)) : null;
    },
    mySalarySlips: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      const user = assertAuthenticated(ctx);
      const docs = await SalarySlipModel.find({ employeeId: user.id })
        .sort({ year: -1, month: -1 })
        .lean();
      return withIds(docs);
    },
    mySupportTickets: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      const user = assertAuthenticated(ctx);
      const docs = await SupportTicketModel.find({ employeeId: user.id })
        .sort({ createdAt: -1 })
        .lean();
      return withIds(docs);
    },
    mySupportReplies: async (
      _p: unknown,
      { ticketId }: { ticketId: string },
      ctx: GraphQLContext,
    ) => {
      await ownTicket(ticketId, ctx);
      const docs = await SupportReplyModel.find({ ticketId, internal: false })
        .sort({ createdAt: 1 })
        .lean();
      return withIds(docs);
    },
    listHolidays: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertAuthenticated(ctx);
      return withIds(await HolidayModel.find().sort({ date: 1 }).lean());
    },
  },
  Mutation: {
    createSupportTicket: async (
      _p: unknown,
      { input }: { input: SupportTicketInput },
      ctx: GraphQLContext,
    ) => {
      const user = assertAuthenticated(ctx);
      // Reference and deadline are stamped on the same terms as a customer ticket: one
      // queue, one promise, whoever asked.
      const raisedAt = new Date();
      const doc = await SupportTicketModel.create({
        ...input,
        attachments: toAttachments(input.attachments, user.email),
        employeeId: user.id,
        requesterType: 'EMPLOYEE',
        reference: await uniqueReference(),
        status: 'OPEN',
        dueAt: await dueAtForPriority(input.priority, raisedAt),
      });
      return withId(doc.toObject());
    },
    addMySupportReply: async (
      _p: unknown,
      {
        ticketId,
        body,
        attachments,
      }: { ticketId: string; body: string; attachments?: AttachmentInput[] | null },
      ctx: GraphQLContext,
    ) => {
      if (!body.trim()) badRequest('A reply cannot be empty.');
      const { user } = await ownTicket(ticketId, ctx);
      // Stored with the reply so the thread still reads once the account is gone.
      const author = await UserModel.findById(user.id)
        .select('name')
        .lean()
        .catch(() => null);
      const authorName = author?.name ?? user.email;
      const reply = await SupportReplyModel.create({
        ticketId,
        authorId: user.id,
        authorName,
        body: body.trim(),
        internal: false,
        attachments: toAttachments(attachments, authorName),
      });
      return withId(reply.toObject());
    },
  },
};
