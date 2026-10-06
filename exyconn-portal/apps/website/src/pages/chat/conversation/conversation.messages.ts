import {
  WebsiteChatAttachmentKind,
  WebsiteChatChannel,
  WebsiteChatSender,
} from '@exyconn/shell/graphql/generated';
import type { ChatFileFrame, ChatMessage, ChatSession } from '../socket/chatSocket.types';

/** A reply shown before the server has echoed it back; `failed` once the server refused it. */
export interface PendingMessage {
  clientId: string;
  message: ChatMessage;
  failed: boolean;
}

/** History and live frames as one thread: each message once, oldest first. */
export function mergeMessages(history: readonly ChatMessage[], live: readonly ChatMessage[]) {
  const byId = new Map<string, ChatMessage>();
  for (const message of [...history, ...live]) {
    byId.set(message.id, message);
  }
  return [...byId.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** A message as the Apollo cache holds it: the socket's copy carries no `__typename`s. */
export function toCachedMessage(message: ChatMessage): ChatMessage {
  return {
    ...message,
    __typename: 'WebsiteChatMessage',
    attachments: message.attachments.map((file) => ({
      ...file,
      __typename: 'WebsiteChatAttachment',
    })),
    sources: message.sources.map((source) => ({ ...source, __typename: 'WebsiteChatSource' })),
  };
}

/** After the visitor reads the replies, every reply so far shows as seen. */
export function withVisitorRead(messages: ChatMessage[], visitorReadAt: string | null) {
  if (!visitorReadAt) {
    return messages;
  }
  return messages.map((message) =>
    message.sender !== WebsiteChatSender.Visitor && !message.readAt
      ? { ...message, readAt: visitorReadAt }
      : message,
  );
}

/** The more recently updated of the query's copy and the socket's copy of a session. */
export function newerSession(
  fromQuery: ChatSession | undefined,
  fromSocket: ChatSession | null,
): ChatSession | undefined {
  if (!fromSocket) {
    return fromQuery;
  }
  if (!fromQuery) {
    return fromSocket;
  }
  return fromSocket.updatedAt > fromQuery.updatedAt ? fromSocket : fromQuery;
}

function kindOf(dataUrl: string): WebsiteChatAttachmentKind {
  if (dataUrl.startsWith('data:video/')) {
    return WebsiteChatAttachmentKind.Video;
  }
  if (dataUrl.startsWith('data:audio/')) {
    return WebsiteChatAttachmentKind.Audio;
  }
  return WebsiteChatAttachmentKind.Image;
}

interface OptimisticInput {
  clientId: string;
  sessionId: string;
  senderName: string;
  body: string;
  files: ChatFileFrame[];
}

/** The agent's reply as it will look once sent, shown straight away. */
export function optimisticMessage(input: OptimisticInput): ChatMessage {
  return {
    id: input.clientId,
    sessionId: input.sessionId,
    channel: WebsiteChatChannel.Live,
    sender: WebsiteChatSender.Agent,
    senderName: input.senderName,
    body: input.body,
    attachments: input.files.map((file) => ({
      url: file.data,
      name: file.name,
      kind: kindOf(file.data),
      // Base64 carries 3 bytes in every 4 characters.
      size: Math.round((file.data.length * 3) / 4),
    })),
    sources: [],
    suggestions: [],
    feedback: null,
    createdAt: new Date().toISOString(),
    readAt: null,
  };
}
