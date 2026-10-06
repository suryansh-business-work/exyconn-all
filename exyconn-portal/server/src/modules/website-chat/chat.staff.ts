import type { Request } from 'express';
import { ROLES } from '../../constants/roles';
import { actorNameOf } from '../../lib/actor';
import { assertPlatformStaff } from '../../lib/platformAccess';
import type { PermissionAction } from '../permissions/permission.model';
import { runInScope } from '../../lib/tenant';
import { buildContext, type GraphQLContext } from '../../middleware/auth';
import { badRequest, notFound } from '../../utils/errors';
import { ChatSessionModel } from './models';
import { uploadChatFiles, type ChatFileInput } from './chat.media';
import { announceSession, markReadByStaff, postMessage } from './chat.messages';
import { readChatSettings } from './chat.settings';
import { relayToSlack } from './chat.slack';

/** The permission matrix row Website > Chatbot is governed by. */
export const CHAT_MODULE = 'WebsiteChatSession';
export const CHAT_ROLES = [ROLES.WEBSITE];

/** A website team member acting in the chat. */
export interface ChatAgent {
  id: string;
  name: string;
}

/**
 * Checks a portal token presented over the chat socket exactly as a GraphQL request's would be
 * checked (account active, session live, company open), in a scope of its own so nothing it
 * sets leaks into the socket's work.
 */
function contextForToken(token: string, ip: string): Promise<GraphQLContext> {
  const req = {
    headers: { authorization: `Bearer ${token}` },
    ip,
    query: {},
  } as unknown as Request;
  return runInScope({ organizationId: null, platform: false }, () => buildContext({ req }));
}

/** The team member behind a request, refused unless they may do `action` in the chat. */
export async function chatAgentFor(
  ctx: GraphQLContext,
  action: PermissionAction,
): Promise<ChatAgent> {
  const user = await assertPlatformStaff(ctx, CHAT_MODULE, CHAT_ROLES, action);
  return { id: user.id, name: await actorNameOf(ctx) };
}

/** The team member behind a socket's token. */
export async function chatAgentForToken(
  token: string,
  ip: string,
  action: PermissionAction,
): Promise<ChatAgent> {
  return chatAgentFor(await contextForToken(token, ip), action);
}

/** Takes an unassigned chat, so the team can see who is answering it. */
export async function claimSession(sessionId: string, agent: ChatAgent) {
  const session = await ChatSessionModel.findByIdAndUpdate(
    sessionId,
    { assigneeId: agent.id, assigneeName: agent.name },
    { new: true },
  ).lean();
  if (!session) {
    notFound('Chat');
  }
  announceSession(session);
  return session;
}

/**
 * An agent's reply in the live thread. The first person to reply takes the chat if nobody
 * has; replying also marks the visitor's messages read.
 */
export async function agentReply(
  sessionId: string,
  agent: ChatAgent,
  body: string,
  files: ChatFileInput[],
  clientId: string,
): Promise<void> {
  const session = await ChatSessionModel.findById(sessionId)
    .select('status assigneeId slackChannel slackThreadTs')
    .lean();
  if (!session) {
    notFound('Chat');
  }
  if (session.status !== 'OPEN') {
    badRequest('This chat has ended.');
  }
  if (body === '' && files.length === 0) {
    badRequest('Write a message or attach a file.');
  }
  const { maxUploadMb } = await readChatSettings();
  const attachments = await uploadChatFiles(files, maxUploadMb);
  if (!session.assigneeId) {
    await claimSession(sessionId, agent);
  }
  await postMessage(
    {
      sessionId,
      channel: 'LIVE',
      sender: 'AGENT',
      senderName: agent.name,
      senderId: agent.id,
      body,
      attachments,
    },
    clientId,
  );
  relayToSlack(session, `${agent.name} (portal)`, body, attachments);
  await markReadByStaff(sessionId);
}
