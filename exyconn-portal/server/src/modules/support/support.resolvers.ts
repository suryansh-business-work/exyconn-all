import { isValidObjectId, type FilterQuery } from 'mongoose';
import {
  SUPPORT_CLOSED_STATUSES,
  SupportTicketModel,
  type SupportTicketDocument,
} from '../employee/support.model';
import { SupportReplyModel } from './support-reply.model';
import { notifyRequesterOfReply } from './support.notify';
import { toAttachments, type AttachmentInput } from './attachment.schema';
import { supportReplyFields, supportTicketFields } from './support.fields';
import { dueAtForPriority, supportSlaSummary } from './sla.service';
import { supportSlaPolicyCrud } from './sla.crud';
import {
  clientSupportTicketStatus,
  createClientSupportTicket,
  type ClientSupportTicketInput,
} from './client-ticket.service';
import { UserModel } from '../admin/user.model';
import { deskScope, IT_CATEGORY, type TicketScope } from './desk';
import { escalateTicket } from './escalation';
import { ROLES } from '../../constants/roles';
import { badRequest, notFound } from '../../utils/errors';
import { withId, withIds } from '../../utils/serialize';
import {
  tableQuery,
  tableStats,
  type TableConfig,
  type TableFilterInput,
  type TableQueryInput,
} from '../../utils/tableQuery';
import type { GraphQLContext } from '../../middleware/auth';

/** What the console grid may search, filter and sort on. */
const TICKET_TABLE: TableConfig = {
  searchFields: [
    'subject',
    'description',
    'assigneeName',
    'clientName',
    'requesterName',
    'requesterEmail',
    'reference',
  ],
  filterFields: [
    'status',
    'priority',
    'category',
    'assigneeId',
    'requesterType',
    'channel',
    'clientId',
  ],
  sortFields: [
    'subject',
    'category',
    'priority',
    'status',
    'requesterType',
    'channel',
    'assigneeName',
    'dueAt',
    'createdAt',
  ],
  defaultSort: { field: 'createdAt', dir: 'DESC' },
};

const TICKET_STATS = { countBy: ['status', 'priority', 'category', 'requesterType', 'channel'] };

type LeanTicket = SupportTicketDocument & { _id: unknown; createdAt: Date };
type TicketFilter = FilterQuery<SupportTicketDocument>;

/** Resolves employee display names in one query (avoids N+1). Customer tickets have none. */
async function withEmployeeNames<T extends { _id: unknown; employeeId: string }>(tickets: T[]) {
  const ids = [...new Set(tickets.map((t) => t.employeeId).filter(Boolean))];
  const users = await UserModel.find({ _id: { $in: ids } })
    .select('name')
    .lean();
  const nameById = new Map(users.map((u) => [u._id.toString(), u.name]));
  return withIds(tickets.map((t) => ({ ...t, employeeName: nameById.get(t.employeeId) ?? null })));
}

/**
 * Two quick filters cannot travel as ordinary column filters, so they are lifted out of
 * the request into the base query instead:
 *
 * - "unassigned" IS an empty assignee, and the table engine drops an empty value;
 * - "employees" has to include every ticket raised before customer tickets existed, which
 *   carries no `requesterType` at all rather than EMPLOYEE;
 * - "overdue" is a computed state, not a column: it is an unresolved ticket past its
 *   deadline, which is two conditions the grid cannot express.
 *
 * Every other filter goes through untouched.
 */
function splitSpecialFilters(input: TableQueryInput): {
  input: TableQueryInput;
  base: TicketFilter;
} {
  const base: TicketFilter = {};
  const kept: TableFilterInput[] = [];
  for (const filter of input.filters ?? []) {
    if (filter.field === 'assigneeId' && filter.value === '') {
      base.assigneeId = '';
    } else if (filter.field === 'requesterType' && filter.value === 'EMPLOYEE') {
      base.requesterType = { $ne: 'CLIENT' };
    } else if (filter.field === 'slaState' && filter.value === 'BREACHED') {
      base.resolvedAt = null;
      base.dueAt = { $lt: new Date() };
    } else {
      kept.push(filter);
    }
  }
  return { input: { ...input, filters: kept }, base };
}

/** The ticket, or a 404 that says nothing about whether the id ever existed. */
async function ticketById(id: string, scope: TicketScope): Promise<LeanTicket> {
  if (!isValidObjectId(id)) notFound('SupportTicket');
  const doc = await SupportTicketModel.findOne({ _id: id, ...scope }).lean<LeanTicket | null>();
  if (!doc) notFound('SupportTicket');
  return doc;
}

/**
 * Support desk: read every ticket, hand it to someone, move it through its lifecycle,
 * hold the conversation on it — plus the two operations a customer calls with no account.
 */
export const supportResolvers = {
  SupportTicket: supportTicketFields,
  SupportReply: supportReplyFields,
  Query: {
    ...supportSlaPolicyCrud.Query,

    listSupportTickets: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      const scope = deskScope(ctx);
      const tickets = await SupportTicketModel.find(scope).sort({ createdAt: -1 }).lean();
      return withEmployeeNames(tickets);
    },

    listSupportTicketsPaged: async (
      _p: unknown,
      { input }: { input: TableQueryInput },
      ctx: GraphQLContext,
    ) => {
      const scope = deskScope(ctx);
      const query = splitSpecialFilters(input);
      const base = { ...query.base, ...scope };
      const page = await tableQuery(SupportTicketModel, query.input, TICKET_TABLE, base);
      return {
        rows: await withEmployeeNames(page.rows as LeanTicket[]),
        totalCount: page.totalCount,
      };
    },

    listSupportTicketsStats: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      return tableStats(SupportTicketModel, TICKET_STATS, deskScope(ctx));
    },

    getSupportTicket: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      const [ticket] = await withEmployeeNames([await ticketById(id, deskScope(ctx))]);
      return ticket;
    },

    supportSlaSummary: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      return supportSlaSummary(deskScope(ctx));
    },

    listSupportReplies: async (
      _p: unknown,
      { ticketId }: { ticketId: string },
      ctx: GraphQLContext,
    ) => {
      await ticketById(ticketId, deskScope(ctx));
      return withIds(await SupportReplyModel.find({ ticketId }).sort({ createdAt: 1 }).lean());
    },

    /** Who a ticket may be handed to: IT for an IT ticket, the support desk for the rest. */
    listSupportAgents: async (
      _p: unknown,
      { category }: { category?: string | null },
      ctx: GraphQLContext,
    ) => {
      const scope = deskScope(ctx);
      const itQueue = (scope.category ?? category) === IT_CATEGORY;
      const agents = await UserModel.find({ roles: itQueue ? ROLES.IT : ROLES.SUPPORT })
        .select('name email')
        .sort({ name: 1 })
        .lean();
      return withIds(agents);
    },

    /** Unauthenticated — a customer follows their own ticket with reference + address. */
    clientSupportTicketStatus: (
      _p: unknown,
      { reference, email }: { reference: string; email: string },
      ctx: GraphQLContext,
    ) => clientSupportTicketStatus(reference, email, ctx.ip),
  },
  Mutation: {
    ...supportSlaPolicyCrud.Mutation,

    /**
     * Moves a ticket through its lifecycle and keeps the resolution clock honest:
     * finishing it stamps `resolvedAt`, reopening it clears the stamp so the ticket goes
     * back to being measured against its deadline.
     */
    setSupportTicketStatus: async (
      _p: unknown,
      { id, status }: { id: string; status: string },
      ctx: GraphQLContext,
    ) => {
      const ticket = await ticketById(id, deskScope(ctx));
      const closed = SUPPORT_CLOSED_STATUSES.has(status);
      const resolvedAt = closed ? (ticket.resolvedAt ?? new Date()) : null;
      const doc = await SupportTicketModel.findByIdAndUpdate(
        id,
        { status, resolvedAt },
        { new: true },
      ).lean();
      if (!doc) notFound('SupportTicket');
      return withId(doc);
    },

    /** Re-triage. A new priority is a new promise, so the deadline is recomputed. */
    setSupportTicketTriage: async (
      _p: unknown,
      {
        id,
        category,
        priority,
        topic,
      }: { id: string; category: string; priority: string; topic?: string | null },
      ctx: GraphQLContext,
    ) => {
      const ticket = await ticketById(id, deskScope(ctx));
      const dueAt = await dueAtForPriority(priority, ticket.createdAt);
      const doc = await SupportTicketModel.findByIdAndUpdate(
        id,
        { category, priority, dueAt, ...(topic == null ? {} : { topic: topic.trim() }) },
        { new: true, runValidators: true },
      ).lean();
      if (!doc) notFound('SupportTicket');
      return withId(doc);
    },

    escalateSupportTicket: (
      _p: unknown,
      { id, reason }: { id: string; reason: string },
      ctx: GraphQLContext,
    ) => escalateTicket(id, reason, deskScope(ctx), ctx),

    /** An empty id puts the ticket back in the unassigned queue. */
    assignSupportTicket: async (
      _p: unknown,
      { id, assigneeId }: { id: string; assigneeId: string },
      ctx: GraphQLContext,
    ) => {
      await ticketById(id, deskScope(ctx));
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
      {
        ticketId,
        body,
        internal,
        attachments,
      }: {
        ticketId: string;
        body: string;
        internal: boolean;
        attachments?: AttachmentInput[] | null;
      },
      ctx: GraphQLContext,
    ) => {
      const scope = deskScope(ctx);
      if (!body.trim()) {
        badRequest('A reply cannot be empty.');
      }
      const ticket = await ticketById(ticketId, scope);
      // The token carries no display name, so the author is resolved once here and
      // stored on the reply — a thread has to stay readable years later. A lookup
      // that fails must not lose the reply, which is the part that matters.
      const authorId = ctx.user?.id ?? '';
      const author = await UserModel.findById(authorId)
        .select('name')
        .lean()
        .catch(() => null);
      const authorName = author?.name ?? 'Support';
      const reply = await SupportReplyModel.create({
        ticketId,
        authorId,
        authorName,
        body: body.trim(),
        internal,
        attachments: toAttachments(attachments, authorName),
      });
      if (!internal) {
        // The first public reply is the one the first-response promise is measured by;
        // an internal note is the team talking to itself and does not count.
        if (!ticket.firstRespondedAt) {
          await SupportTicketModel.updateOne({ _id: ticketId }, { firstRespondedAt: new Date() });
        }
        await notifyRequesterOfReply(ticket, reply.body);
      }
      return withId(reply.toObject());
    },

    /**
     * Unauthenticated — anybody who buys from us must be able to ask for help. An agent
     * signed into the console raises one the same way, and the channel records which it was.
     */
    createClientSupportTicket: (
      _p: unknown,
      { input }: { input: ClientSupportTicketInput },
      ctx: GraphQLContext,
    ) => createClientSupportTicket(input, ctx.user ? 'AGENT' : 'PORTAL', ctx.ip),
  },
};
