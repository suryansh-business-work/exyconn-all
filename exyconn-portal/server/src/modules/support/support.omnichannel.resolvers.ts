import { isValidObjectId } from 'mongoose';
import { SupportTicketModel } from '../employee/support.model';
import { deskScope, type TicketScope } from './desk';
import { ticketSource } from './support.source';
import { suggestSupportReply } from './support.suggest';
import { submitSupportCsat, supportCsatSurvey } from './support.csat';
import { notFound } from '../../utils/errors';
import type { GraphQLContext } from '../../middleware/auth';

/** The ticket, inside the caller's desk, or a 404 that says nothing more. */
async function scopedTicket(id: string, scope: TicketScope) {
  if (!isValidObjectId(id)) notFound('SupportTicket');
  const ticket = await SupportTicketModel.findOne({ _id: id, ...scope })
    .select('subject description category channel requesterName')
    .lean();
  if (!ticket) notFound('SupportTicket');
  return ticket;
}

/** The linked conversation, the AI suggested reply and the public satisfaction survey. */
export const supportOmnichannelResolvers = {
  Query: {
    supportTicketSource: async (
      _p: unknown,
      { ticketId }: { ticketId: string },
      ctx: GraphQLContext,
    ) => ticketSource(await scopedTicket(ticketId, deskScope(ctx))),

    /** Unauthenticated — the survey link is the credential. */
    supportCsatSurvey: (_p: unknown, { token }: { token: string }, ctx: GraphQLContext) =>
      supportCsatSurvey(token, ctx.ip),
  },
  Mutation: {
    suggestSupportReply: async (
      _p: unknown,
      { ticketId }: { ticketId: string },
      ctx: GraphQLContext,
    ) => {
      const scope = deskScope(ctx);
      const ticket = await scopedTicket(ticketId, scope);
      // deskScope has already refused a caller who is not signed in.
      const user = ctx.user as NonNullable<GraphQLContext['user']>;
      return suggestSupportReply(ticket, scope, { id: user.id, name: user.email });
    },

    /** Unauthenticated — one answer per survey link. */
    submitSupportCsat: (
      _p: unknown,
      { token, score, comment }: { token: string; score: number; comment?: string | null },
      ctx: GraphQLContext,
    ) => submitSupportCsat(token, score, comment ?? '', ctx.ip),
  },
};
