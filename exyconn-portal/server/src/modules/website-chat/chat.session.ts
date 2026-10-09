import { EMAIL_CODE_TTL_LABEL, consumeEmailCode, issueEmailCode } from '../../lib/emailCode';
import { createLimiter, enforceLimit } from '../../lib/rateLimiter';
import { env } from '../../config/env';
import { badRequest, notFound } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { emailer } from '../email/email.service';
import { fileClientTicket } from '../support/client-ticket.service';
import { ChatSessionModel, type ChatSite } from './models';
import { readChatPass, signChatPass } from './chat.token';
import { announceSession, listMessages, postMessage } from './chat.messages';
import { readChatSettings } from './chat.settings';
import { emailTranscript } from './chat.transcript';
import { assignFreeAgent } from './chat.assign';
import { toVisitorSession } from './chat.serialize';
import type { ChatIdentity } from './chat.validation';

/** Nobody is mail-bombed through the chat: five codes an hour per address, twenty per network. */
const codeAddressLimiter = createLimiter({
  keyPrefix: 'website_chat_code_address',
  points: 5,
  durationSec: 3600,
});
const codeIpLimiter = createLimiter({
  keyPrefix: 'website_chat_code_ip',
  points: 20,
  durationSec: 3600,
});
/** Guesses per address, across codes: on top of each code's own five. */
const verifyAddressLimiter = createLimiter({
  keyPrefix: 'website_chat_verify_address',
  points: 15,
  durationSec: 15 * 60,
});
/** Every session files a ticket, so starting one is limited like raising a ticket is. */
const sessionLimiter = createLimiter({
  keyPrefix: 'website_chat_session_address',
  points: 10,
  durationSec: 3600,
});

const SITE_LABEL: Readonly<Record<ChatSite, string>> = {
  WEBSITE: 'exyconn.com',
  TOOLS: 'tools.exyconn.com',
};

/** Emails a fresh sign-in code to the address; any code sent before is spent. */
export async function requestChatCode(identity: ChatIdentity, ip: string): Promise<void> {
  await enforceLimit(codeIpLimiter, ip, 'code requests');
  await enforceLimit(codeAddressLimiter, identity.email, 'codes for this address');
  const code = await issueEmailCode('website-chat', identity.email);
  try {
    await emailer.send({
      template: 'website-chat-code',
      to: identity.email,
      variables: { name: identity.name, code, expiresIn: EMAIL_CODE_TTL_LABEL },
      triggeredBy: 'Website chat sign-in',
    });
  } catch (error) {
    logger.error({ err: error }, 'Website chat code email failed');
    badRequest('We could not send the code just now. Try again in a minute.');
  }
}

/** The ticket every chat opens, so the support desk sees the conversation in its own queue. */
async function openTicket(sessionId: string, identity: ChatIdentity) {
  const lines = [
    `${identity.name} started a chat on ${SITE_LABEL[identity.site]}.`,
    `Page: ${identity.pageUrl || 'not reported'}`,
    `Phone: ${identity.phone || 'not given'}`,
    `Conversation: ${env.websiteChatConsoleUrl}/${sessionId}`,
  ];
  return fileClientTicket(
    {
      requesterName: identity.name,
      requesterEmail: identity.email,
      subject: `Website chat with ${identity.name}`,
      category: 'OTHER',
      description: lines.join('\n'),
      priority: 'MEDIUM',
    },
    'CHAT',
  );
}

/**
 * Opens a session for a verified visitor: files its ticket, posts the welcome, and emails the
 * confirmation with the ticket reference. Hands back the pass and the conversation so far.
 */
export async function openSession(identity: ChatIdentity) {
  await enforceLimit(sessionLimiter, identity.email, 'new chats for this address');
  const settings = await readChatSettings();
  const session = await ChatSessionModel.create({
    ...identity,
    expiresAt: new Date(Date.now() + settings.sessionTimeoutMinutes * 60_000),
  });
  const sessionId = String(session._id);
  const ticket = await openTicket(sessionId, identity);
  const saved = await ChatSessionModel.findByIdAndUpdate(
    sessionId,
    { ticketId: String(ticket._id), ticketReference: ticket.reference },
    { new: true },
  ).lean();
  if (!saved) {
    notFound('Chat');
  }
  await postMessage({
    sessionId,
    channel: 'LIVE',
    sender: 'SYSTEM',
    senderName: '',
    body: settings.welcomeMessage,
  });
  emailer
    .send({
      template: 'website-chat-started',
      to: identity.email,
      variables: { name: identity.name, reference: ticket.reference },
      triggeredBy: 'Website chat started',
    })
    .catch((error: unknown) => logger.error({ err: error }, 'Website chat confirmation failed'));
  announceSession(saved);
  await assignFreeAgent(sessionId);
  const current = await ChatSessionModel.findById(sessionId).lean();
  return signedIn(current ?? saved);
}

/** What the widget gets on signing in or reconnecting: its pass, session and conversation. */
async function signedIn(
  session: Parameters<typeof toVisitorSession>[0] & { tokenVersion: number },
) {
  const sessionId = String(session._id);
  return {
    token: signChatPass(sessionId, session.tokenVersion),
    session: toVisitorSession(session),
    messages: await listMessages(sessionId),
  };
}

/** Checks the emailed code and opens the visitor's session. */
export async function verifyChatCode(identity: ChatIdentity, code: string) {
  await enforceLimit(verifyAddressLimiter, identity.email, 'code attempts');
  await consumeEmailCode('website-chat', identity.email, code);
  return openSession(identity);
}

/** The session a pass names, or null when the pass is forged, expired or retired. */
export async function sessionForPass(token: string) {
  const claims = readChatPass(token);
  if (!claims) {
    return null;
  }
  const session = await ChatSessionModel.findById(claims.sessionId).lean();
  return session?.tokenVersion === claims.tv ? session : null;
}

/** Reconnects a widget to its session, closed or not. */
export async function resumeSession(token: string) {
  const session = await sessionForPass(token);
  return session ? signedIn(session) : null;
}

/** A visitor whose chat has ended starts another without a new code: their pass proves the address. */
export async function startNewChat(token: string) {
  const previous = await sessionForPass(token);
  if (!previous) {
    badRequest('Sign in again to start a new chat.');
  }
  return openSession({
    name: previous.name,
    email: previous.email,
    phone: previous.phone,
    pageUrl: previous.pageUrl,
    site: previous.site,
  });
}

/**
 * Ends a chat — the visitor, the team or the session timeout — and, when the settings say so,
 * emails the visitor the conversation. The ticket stays with the desk: ending the chat is not
 * resolving it. `notice` is what the visitor reads; by default, who ended it.
 */
export async function closeSession(sessionId: string, closedBy: string, notice?: string) {
  const session = await ChatSessionModel.findOneAndUpdate(
    { _id: sessionId, status: 'OPEN' },
    { status: 'CLOSED', closedAt: new Date(), closedBy, awaitingReplySince: null },
    { new: true },
  ).lean();
  if (!session) {
    const existing = await ChatSessionModel.findById(sessionId).lean();
    if (!existing) {
      notFound('Chat');
    }
    return existing;
  }
  await postMessage({
    sessionId,
    channel: 'LIVE',
    sender: 'SYSTEM',
    senderName: '',
    body: notice ?? `Chat ended by ${closedBy}.`,
  });
  const closed = await ChatSessionModel.findById(sessionId).lean();
  if (closed) {
    announceSession(closed);
  }
  const { transcriptOnClose } = await readChatSettings();
  if (transcriptOnClose) {
    emailTranscript(session).catch((error: unknown) =>
      logger.error({ err: error }, 'Website chat transcript failed'),
    );
  }
  return session;
}
