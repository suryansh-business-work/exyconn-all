import { isOnline } from '../admin/presence';
import { UserModel } from '../admin/user.model';
import { ChatSessionModel } from './models';
import { announceSession } from './chat.messages';
import { readChatSettings } from './chat.settings';
import { notifyAgentOnSlack } from './chat.slack';
import { logger } from '../../utils/logger';

/** A team member a chat can go to, and how busy they are. */
export interface ChatAgentLoad {
  id: string;
  name: string;
  email: string;
  online: boolean;
  openChats: number;
  lastAssignedAt: Date | null;
}

/** Every listed agent who can still sign in, with their open chats and whether they are online. */
export async function agentLoads(agentIds: readonly string[]): Promise<ChatAgentLoad[]> {
  if (agentIds.length === 0) {
    return [];
  }
  const [users, open] = await Promise.all([
    UserModel.find({ _id: { $in: agentIds }, isActive: true, isBlocked: { $ne: true } })
      .select('name email lastActiveAt')
      .lean(),
    ChatSessionModel.aggregate<{ _id: string; count: number; last: Date | null }>([
      { $match: { status: 'OPEN', assigneeId: { $in: [...agentIds] } } },
      { $group: { _id: '$assigneeId', count: { $sum: 1 }, last: { $max: '$assignedAt' } } },
    ]),
  ]);
  const byAgent = new Map(open.map((row) => [row._id, row]));
  return users.map((user) => {
    const id = String(user._id);
    return {
      id,
      name: user.name,
      email: user.email,
      online: isOnline(user.lastActiveAt),
      openChats: byAgent.get(id)?.count ?? 0,
      lastAssignedAt: byAgent.get(id)?.last ?? null,
    };
  });
}

/**
 * The freest agent: online before offline, then the fewest open chats, then whoever was given
 * a chat longest ago — so a quiet team shares the work rather than the first name taking it all.
 */
export function freestAgent(loads: readonly ChatAgentLoad[]): ChatAgentLoad | null {
  const ranked = [...loads].sort((a, b) => {
    if (a.online !== b.online) {
      return a.online ? -1 : 1;
    }
    if (a.openChats !== b.openChats) {
      return a.openChats - b.openChats;
    }
    return (a.lastAssignedAt?.getTime() ?? 0) - (b.lastAssignedAt?.getTime() ?? 0);
  });
  return ranked[0] ?? null;
}

/**
 * Gives a new chat to the freest agent in Website > Chatbot > Settings and, when Slack is on,
 * opens their Slack thread for it. No agents listed leaves the chat for anyone to claim.
 */
export async function assignFreeAgent(sessionId: string): Promise<void> {
  const settings = await readChatSettings();
  const agent = freestAgent(await agentLoads(settings.agentIds));
  if (!agent) {
    return;
  }
  const session = await ChatSessionModel.findOneAndUpdate(
    { _id: sessionId, assigneeId: '' },
    { assigneeId: agent.id, assigneeName: agent.name, assignedAt: new Date() },
    { new: true },
  ).lean();
  if (!session) {
    return;
  }
  announceSession(session);
  if (settings.slackEnabled) {
    notifyAgentOnSlack(session, agent).catch((error: unknown) =>
      logger.error({ err: error }, 'Website chat Slack notification failed'),
    );
  }
}
