import { createLimiter, enforceLimit } from '../../lib/rateLimiter';
import { badRequest } from '../../utils/errors';
import { answerQuestion } from './chat.bot';
import { handOff } from './chat.handoff';
import { isWithinHours } from './chat.hours';
import { chatHub, type ChatPeer } from './chat.hub';
import { uploadChatFiles } from './chat.media';
import { markReadByVisitor, postMessage } from './chat.messages';
import {
  closeSession,
  requestChatCode,
  resumeSession,
  sessionForPass,
  startNewChat,
  verifyChatCode,
} from './chat.session';
import { readChatSettings, widgetConfig } from './chat.settings';
import {
  parseInput,
  visitorFrameSchema,
  type ChatIdentity,
  type VisitorFrame,
} from './chat.validation';
import type { ChatSite } from './models';

type SendFrame = Extract<VisitorFrame, { t: 'send' }>;

/** A burst of messages is a person; sixty a minute is a script. */
const messageLimiter = createLimiter({
  keyPrefix: 'website_chat_message',
  points: 60,
  durationSec: 60,
});

/** The visitor's live session, refused when they are not signed in or the chat has ended. */
async function openSessionOf(peer: ChatPeer, token: string) {
  const session = token ? await sessionForPass(token) : null;
  if (!session || String(session._id) !== peer.sessionId) {
    badRequest('Sign in to chat.');
  }
  if (session.status !== 'OPEN') {
    badRequest('This chat has ended. Start a new one.');
  }
  return session;
}

/** Signs the socket in to a session and hands the widget its pass and history. */
function signIn(peer: ChatPeer, result: Awaited<ReturnType<typeof resumeSession>>): void {
  if (!result) {
    peer.sessionId = null;
    chatHub.send(peer, { t: 'signedOut' });
    return;
  }
  peer.sessionId = result.session.id;
  peer.token = result.token;
  chatHub.send(peer, { t: 'signedIn', ...result });
}

/** Opening the widget: its config, and its session when it still holds a pass. */
export async function greetVisitor(peer: ChatPeer, site: ChatSite, token?: string): Promise<void> {
  peer.role = 'visitor';
  peer.site = site;
  chatHub.send(peer, { t: 'config', config: await widgetConfig(), site });
  if (token) {
    signIn(peer, await resumeSession(token));
  }
}

async function send(peer: ChatPeer, frame: SendFrame): Promise<void> {
  const session = await openSessionOf(peer, peer.token);
  const sessionId = String(session._id);
  await enforceLimit(messageLimiter, sessionId, 'messages');
  const settings = await readChatSettings();
  if (frame.channel === 'KNOWLEDGE' && frame.files.length > 0) {
    badRequest('The knowledge bot reads text only.');
  }
  if (frame.files.length > 0 && !settings.allowUploads) {
    badRequest('Files cannot be sent in this chat.');
  }
  if (frame.body === '' && frame.files.length === 0) {
    badRequest('Write a message first.');
  }
  const attachments = await uploadChatFiles(frame.files, settings.maxUploadMb);
  const message = {
    sessionId,
    sender: 'VISITOR' as const,
    senderName: session.name,
    body: frame.body,
  };
  await postMessage({ ...message, channel: frame.channel, attachments }, frame.clientId);
  if (frame.channel === 'KNOWLEDGE') {
    await answerQuestion(sessionId, frame.body);
    return;
  }
  if (!isWithinHours(settings)) {
    await handOff(sessionId, settings.offlineMessage);
  }
}

/** Who the visitor says they are, on the site their widget runs on. */
function identityOf(frame: Omit<ChatIdentity, 'site'>, site: ChatSite): ChatIdentity {
  return { name: frame.name, email: frame.email, phone: frame.phone, pageUrl: frame.pageUrl, site };
}

/** Handles one frame from a visitor's widget. */
export async function handleVisitorFrame(peer: ChatPeer, raw: unknown): Promise<void> {
  const frame = parseInput(visitorFrameSchema, raw);
  switch (frame.t) {
    case 'requestCode':
      await requestChatCode(identityOf(frame, peer.site), peer.ip);
      chatHub.send(peer, { t: 'codeSent', email: frame.email });
      return;
    case 'verifyCode':
      signIn(peer, await verifyChatCode(identityOf(frame, peer.site), frame.code));
      return;
    case 'send':
      return send(peer, frame);
    case 'typing': {
      const session = await openSessionOf(peer, peer.token);
      chatHub.toWatchers(String(session._id), {
        t: 'typing',
        sessionId: String(session._id),
        who: 'VISITOR',
        name: session.name,
        on: frame.on,
      });
      return;
    }
    case 'read':
      if (peer.sessionId) {
        await markReadByVisitor(peer.sessionId);
      }
      return;
    case 'end': {
      const session = await openSessionOf(peer, peer.token);
      await closeSession(String(session._id), session.name);
      return;
    }
    case 'newChat':
      signIn(peer, await startNewChat(peer.token));
      return;
    case 'getConfig':
      chatHub.send(peer, { t: 'config', config: await widgetConfig(), site: peer.site });
      return;
    case 'ping':
      chatHub.send(peer, { t: 'pong' });
  }
}
