import type { FilterQuery } from 'mongoose';
import { SupportTicketModel, type SupportTicketDocument } from '../employee/support.model';
import { SupportReplyModel } from './support-reply.model';
import { notifyEmployeeOfReply } from './support.notify';
import { UserModel } from '../admin/user.model';
import { assertRole } from '../../middleware/roleGuard';
import { ROLES } from '../../constants/roles';
import { badRequest, notFound } from '../../utils/errors';
import { withId, withIds } from '../../utils/serialize';
import {
  tableQuery,
  tableStats,
  type TableConfig,
  type TableQueryInput,
} from '../../utils/tableQuery';
import type { GraphQLContext } from '../../middleware/auth';

const supportTeam = [ROLES.SUPPORT];

/** What the console grid may search, filter and sort on. */
const TICKET_TABLE: TableConfig = {
  searchFields: ['subject', 'description', 'assigneeName'],
  filterFields: ['status', 'priority', 'category', 'assigneeId'],
  sortFields: ['subject', 'category', 'priority', 'status', 'assigneeName', 'createdAt'],
  defaultSort: { field: 'createdAt', dir: 'DESC' },
};

const TICKET_STATS = { countBy: ['status', 'priority', 'category'] };

type LeanTicket = SupportTicketDocument & { _id: unknown };

/** Resolves employee display names in one query (avoids N+1). */
async function withEmployeeNames(tickets: LeanTicket[]) {
  const ids = [...new Set(tickets.map((t) => t.employeeId))];
  const users = await UserModel.find({ _id: { $in: ids } })
    .select('name')
    .lean();
  const nameById = new Map(users.map((u) => [u._id.toString(), u.name]));
  return withIds(
    tickets.map((t) => ({ ...t, employeeName: nameById.get(t.employeeId) ?? null })),
  );
}

/**
 * The table engine drops a filter whose value is empty, so "unassigned" — which IS
 * an empty assignee — cannot travel as a normal filter. It is lifted out here into
 * the base filter instead; every other filter goes through untouched.
 */
function splitUnassignedFilter(input: TableQueryInput): {
  input: TableQueryInput;
  base: FilterQuery<SupportTicketDocument>;
} {
  const filters = input.filters ?? [];
  const unassigned = filters.some((f) => f.field === 'assigneeId' && f.value === '');
  if (!unassigned) {
    return { input, base: {} };
  }
  return {
    input: { ...input, filters: filters.filter((f) => f.field !== 'assigneeId') },
    base: { assigneeId: '' },
  };
}

/**
 * Support-team console: read every ticket, hand it to someone, move it through
 * its lifecycle, and hold the conversation on it.
 */
export const supportResolvers = {
  Query: {
    listSupportTickets: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertRole(ctx, supportTeam);
      const tickets = await SupportTicketModel.find().sort({ createdAt: -1 }).lean();
      return withEmployeeNames(tickets);
    },

    listSupportTicketsPaged: async (
      _p: unknown,
      { input }: { input: TableQueryInput },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, supportTeam);
      const query = splitUnassignedFilter(input);
      const page = await tableQuery(SupportTicketModel, query.input, TICKET_TABLE, query.base);
      return {
        rows: await withEmployeeNames(page.rows as LeanTicket[]),
        totalCount: page.totalCount,
      };
    },

    listSupportTicketsStats: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertRole(ctx, supportTeam);
      return tableStats(SupportTicketModel, TICKET_STATS);
    },

    listSupportReplies: async (
      _p: unknown,
      { ticketId }: { ticketId: string },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, supportTeam);
      return withIds(await SupportReplyModel.find({ ticketId }).sort({ createdAt: 1 }).lean());
    },

    listSupportAgents: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertRole(ctx, supportTeam);
      const agents = await UserModel.find({ roles: ROLES.SUPPORT })
        .select('name email')
        .sort({ name: 1 })
        .lean();
      return withIds(agents);
    },
  },
  Mutation: {
    setSupportTicketStatus: async (
      _p: unknown,
      { id, status }: { id: string; status: string },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, supportTeam);
      const doc = await SupportTicketModel.findByIdAndUpdate(id, { status }, { new: true }).lean();
      if (!doc) notFound('SupportTicket');
      return withId(doc);
    },

    setSupportTicketTriage: async (
      _p: unknown,
      { id, category, priority }: { id: string; category: string; priority: string },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, supportTeam);
      const doc = await SupportTicketModel.findByIdAndUpdate(
        id,
        { category, priority },
        { new: true, runValidators: true },
      ).lean();
      if (!doc) notFound('SupportTicket');
      return withId(doc);
    },

    /** An empty id puts the ticket back in the unassigned queue. */
    assignSupportTicket: async (
      _p: unknown,
      { id, assigneeId }: { id: string; assigneeId: string },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, supportTeam);
      let assigneeName = '';
      if (assigneeId) {
        const agent = await UserModel.findById(assigneeId).select('name').lean();
        if (!agent) notFound('User');
        assigneeName = agent.name;
      }
      const doc = await SupportTicketModel.findByIdAndUpdate(
        id,
        { assigneeId, assigneeName },
        { new: true },
      ).lean();
      if (!doc) notFound('SupportTicket');
      return withId(doc);
    },

    addSupportReply: async (
      _p: unknown,
      { ticketId, body, internal }: { ticketId: string; body: string; internal: boolean },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, supportTeam);
      if (!body.trim()) {
        badRequest('A reply cannot be empty.');
      }
      const ticket = await SupportTicketModel.findById(ticketId).lean();
      if (!ticket) notFound('SupportTicket');
      // The token carries no display name, so the author is resolved once here and
      // stored on the reply — a thread has to stay readable years later. A lookup
      // that fails must not lose the reply, which is the part that matters.
      const authorId = ctx.user?.id ?? '';
      const author = await UserModel.findById(authorId)
        .select('name')
        .lean()
        .catch(() => null);
      const reply = await SupportReplyModel.create({
        ticketId,
        authorId,
        authorName: author?.name ?? 'Support',
        body: body.trim(),
        internal,
      });
      if (!internal) {
        await notifyEmployeeOfReply(ticket, reply.body);
      }
      return withId(reply.toObject());
    },
  },
};
