import type { GraphQLContext } from '../../middleware/auth';
import type { PermissionAction } from '../permissions/permission.model';
import { notFound } from '../../utils/errors';
import { tableQuery, tableStats, type TableQueryInput } from '../../utils/tableQuery';
import { withIds } from '../../utils/serialize';
import { ChatMessageModel, ChatSessionModel } from './models';
import { asChatOwner } from './chat.owner';
import { chatAgentFor, claimSession, type ChatAgent } from './chat.staff';
import { closeSession } from './chat.session';
import { listMessages } from './chat.messages';
import { chatSettingsView, updateChatSettings } from './chat.settings';
import { syncWebsiteKnowledge } from './chat.knowledge';
import { forgetKnowledgeCache } from './chat.retrieve';
import { toStaffSession } from './chat.serialize';

const SESSION_TABLE = {
  searchFields: ['name', 'email', 'phone', 'ticketReference', 'lastMessagePreview'],
  filterFields: ['status', 'site', 'assigneeName', 'createdAt', 'lastMessageAt', 'staffUnread'],
  sortFields: ['name', 'email', 'status', 'site', 'createdAt', 'lastMessageAt', 'messageCount'],
  defaultSort: { field: 'lastMessageAt', dir: 'DESC' as const },
};

/** Checks the caller may do `action` in Website > Chatbot, then works in the chat owner's company. */
async function asAgent<T>(
  ctx: GraphQLContext,
  action: PermissionAction,
  work: (agent: ChatAgent) => Promise<T>,
): Promise<T> {
  const agent = await chatAgentFor(ctx, action);
  return asChatOwner(() => work(agent));
}

async function sessionById(id: string) {
  const session = await ChatSessionModel.findById(id).lean();
  if (!session) {
    notFound('Chat');
  }
  return toStaffSession(session);
}

type Id = { id: string };

/** Website > Chatbot: sessions, conversations and settings, for the website team. */
export const websiteChatResolvers = {
  Query: {
    websiteChatSessionsPaged: (
      _p: unknown,
      { input }: { input: TableQueryInput },
      ctx: GraphQLContext,
    ) =>
      asAgent(ctx, 'VIEW', async () => {
        const page = await tableQuery(ChatSessionModel, input, SESSION_TABLE);
        return { rows: withIds(page.rows as Array<{ _id: unknown }>), totalCount: page.totalCount };
      }),
    websiteChatSessionStats: (_p: unknown, _a: unknown, ctx: GraphQLContext) =>
      asAgent(ctx, 'VIEW', () => tableStats(ChatSessionModel, { countBy: ['status', 'site'] })),
    websiteChatSession: (_p: unknown, { id }: Id, ctx: GraphQLContext) =>
      asAgent(ctx, 'VIEW', () => sessionById(id)),
    websiteChatMessages: (_p: unknown, { sessionId }: { sessionId: string }, ctx: GraphQLContext) =>
      asAgent(ctx, 'VIEW', () => listMessages(sessionId)),
    websiteChatSettings: (_p: unknown, _a: unknown, ctx: GraphQLContext) =>
      asAgent(ctx, 'VIEW', chatSettingsView),
  },
  Mutation: {
    updateWebsiteChatSettings: (_p: unknown, { input }: { input: unknown }, ctx: GraphQLContext) =>
      asAgent(ctx, 'EDIT', () => updateChatSettings(input)),
    claimWebsiteChatSession: (_p: unknown, { id }: Id, ctx: GraphQLContext) =>
      asAgent(ctx, 'EDIT', async (agent) => toStaffSession(await claimSession(id, agent))),
    closeWebsiteChatSession: (_p: unknown, { id }: Id, ctx: GraphQLContext) =>
      asAgent(ctx, 'EDIT', async (agent) => toStaffSession(await closeSession(id, agent.name))),
    deleteWebsiteChatSession: (_p: unknown, { id }: Id, ctx: GraphQLContext) =>
      asAgent(ctx, 'DELETE', async () => {
        const result = await ChatSessionModel.deleteOne({ _id: id });
        if (result.deletedCount === 0) {
          notFound('Chat');
        }
        await ChatMessageModel.deleteMany({ sessionId: id });
        return true;
      }),
    syncWebsiteChatKnowledge: (_p: unknown, _a: unknown, ctx: GraphQLContext) =>
      asAgent(ctx, 'EDIT', async () => {
        const result = await syncWebsiteKnowledge();
        forgetKnowledgeCache();
        return result;
      }),
  },
};
