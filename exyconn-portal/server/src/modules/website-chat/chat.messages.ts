import type { UpdateQuery } from 'mongoose';
import {
  ChatMessageModel,
  ChatSessionModel,
  type ChatChannel,
  type ChatSender,
  type ChatSessionDocument,
} from './models';
import type { ChatAttachment } from './chat.media';
import { chatHub } from './chat.hub';
import { toMessage, toStaffSession, toVisitorSession } from './chat.serialize';
import { readChatSettings } from './chat.settings';

export interface NewChatMessage {
  sessionId: string;
  channel: ChatChannel;
  sender: ChatSender;
  senderName: string;
  senderId?: string;
  body: string;
  attachments?: ChatAttachment[];
  sources?: Array<{ title: string; url: string }>;
  suggestions?: string[];
}

/** Who keeps a chat alive by writing: a SYSTEM notice does not. */
const ACTIVE_SENDERS: ReadonlySet<ChatSender> = new Set(['VISITOR', 'AGENT', 'BOT']);

const PREVIEW_LENGTH = 140;
const HISTORY_LIMIT = 1000;

const ATTACHMENT_PREVIEW: Readonly<Record<ChatAttachment['kind'], string>> = {
  IMAGE: 'Picture',
  VIDEO: 'Video',
  AUDIO: 'Voice note',
};

function previewOf(message: NewChatMessage): string {
  const first = message.attachments?.[0];
  const text = message.body || (first ? ATTACHMENT_PREVIEW[first.kind] : '');
  return text.slice(0, PREVIEW_LENGTH);
}

/**
 * How one new message changes its session: the list's preview, counts, the reply clock and
 * when the chat times out.
 */
function sessionChange(
  message: NewChatMessage,
  at: Date,
  timeoutMinutes: number,
): UpdateQuery<ChatSessionDocument> {
  const set: Record<string, unknown> = {
    lastMessageAt: at,
    lastMessagePreview: previewOf(message),
    lastSender: message.sender,
  };
  if (ACTIVE_SENDERS.has(message.sender)) {
    set.expiresAt = new Date(at.getTime() + timeoutMinutes * 60_000);
  }
  const inc: Record<string, number> = { messageCount: 1 };
  if (message.sender === 'VISITOR' && message.channel === 'LIVE') {
    inc.staffUnread = 1;
  }
  if (message.sender === 'AGENT') {
    set.awaitingReplySince = null;
  }
  return { $set: set, $inc: inc };
}

/** Tells the console and the visitor's widgets a session changed (status, assignee, timeout). */
export function announceSession(session: Parameters<typeof toStaffSession>[0]): void {
  chatHub.toStaff({ t: 'session', session: toStaffSession(session) });
  chatHub.toVisitors(String(session._id), { t: 'session', session: toVisitorSession(session) });
}

/**
 * Stores a message and delivers it: to the visitor's widgets and to every console. A visitor's
 * live message starts the reply clock (if it is not already running); an agent's stops it.
 */
export async function postMessage(message: NewChatMessage, clientId?: string) {
  const created = await ChatMessageModel.create({
    ...message,
    senderId: message.senderId ?? '',
    attachments: message.attachments ?? [],
    sources: message.sources ?? [],
    suggestions: message.suggestions ?? [],
  });
  const { sessionTimeoutMinutes } = await readChatSettings();
  if (message.sender === 'VISITOR' && message.channel === 'LIVE') {
    await ChatSessionModel.updateOne(
      { _id: message.sessionId, awaitingReplySince: null },
      { awaitingReplySince: created.createdAt },
    );
  }
  const session = await ChatSessionModel.findByIdAndUpdate(
    message.sessionId,
    sessionChange(message, created.createdAt, sessionTimeoutMinutes),
    { new: true },
  ).lean();
  const frame = { t: 'message', message: toMessage(created.toObject()), clientId };
  chatHub.toVisitors(message.sessionId, frame);
  chatHub.toStaff(frame);
  if (session) {
    announceSession(session);
  }
  return created;
}

/** A session's whole conversation, oldest first. */
export async function listMessages(sessionId: string) {
  const rows = await ChatMessageModel.find({ sessionId })
    .sort({ createdAt: 1 })
    .limit(HISTORY_LIMIT)
    .lean();
  return rows.map(toMessage);
}

/** The team has read the visitor's messages: clears the unread count, shows "Seen" to them. */
export async function markReadByStaff(sessionId: string): Promise<void> {
  const now = new Date();
  await ChatMessageModel.updateMany(
    { sessionId, sender: 'VISITOR', readAt: null },
    { readAt: now },
  );
  const session = await ChatSessionModel.findByIdAndUpdate(
    sessionId,
    { staffUnread: 0 },
    { new: true },
  ).lean();
  if (session) {
    announceSession(session);
  }
  chatHub.toVisitors(sessionId, { t: 'read', by: 'AGENT', at: now });
}

/** The visitor's thumbs up or down on one of the bot's answers in their own session. */
export async function rateAnswer(sessionId: string, messageId: string, helpful: boolean) {
  const message = await ChatMessageModel.findOneAndUpdate(
    { _id: messageId, sessionId, sender: 'BOT' },
    { feedback: helpful ? 'UP' : 'DOWN' },
    { new: true },
  ).lean();
  if (!message) {
    return;
  }
  const frame = { t: 'messageUpdated', message: toMessage(message) };
  chatHub.toVisitors(sessionId, frame);
  chatHub.toStaff(frame);
}

/** The visitor has read the replies: shows "Seen" in the console. */
export async function markReadByVisitor(sessionId: string): Promise<void> {
  const now = new Date();
  await ChatMessageModel.updateMany(
    { sessionId, sender: { $ne: 'VISITOR' }, readAt: null },
    { readAt: now },
  );
  chatHub.toWatchers(sessionId, { t: 'read', sessionId, by: 'VISITOR', at: now });
}
