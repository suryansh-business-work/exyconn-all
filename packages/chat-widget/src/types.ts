/**
 * The website chat's socket protocol, visitor side. The server is
 * exyconn-portal/server/src/modules/website-chat (chat.socket.visitor.ts, chat.validation.ts,
 * chat.serialize.ts); these shapes mirror what it sends and accepts.
 */

export type ChatSite = 'WEBSITE' | 'TOOLS';
export type Channel = 'LIVE' | 'KNOWLEDGE';
export type Sender = 'VISITOR' | 'AGENT' | 'BOT' | 'SYSTEM';
export type AttachmentKind = 'IMAGE' | 'VIDEO' | 'AUDIO';
export type SessionStatus = 'OPEN' | 'CLOSED';

export interface ChatAttachment {
  url: string;
  name: string;
  kind: AttachmentKind;
  size: number;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  channel: Channel;
  sender: Sender;
  senderName: string;
  body: string;
  attachments: ChatAttachment[];
  createdAt: string;
  readAt: string | null;
}

export interface VisitorSession {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: SessionStatus;
  ticketReference: string;
  createdAt: string;
  closedAt: string | null;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface WidgetConfig {
  enabled: boolean;
  botName: string;
  welcomeMessage: string;
  offlineMessage: string;
  online: boolean;
  timezone: string;
  allowUploads: boolean;
  maxUploadMb: number;
  soundEnabledByDefault: boolean;
  faqs: FaqItem[];
}

/** A file as the socket carries it: a `data:` URL whose MIME type has no parameters. */
export interface OutgoingFile {
  name: string;
  data: string;
}

/** Who the visitor says they are; the email is what the code proves. */
export interface Identity {
  name: string;
  email: string;
  phone: string;
}

export type ServerFrame =
  | { t: 'config'; config: WidgetConfig; site: ChatSite }
  | { t: 'codeSent'; email: string }
  | { t: 'signedIn'; token: string; session: VisitorSession; messages: ChatMessage[] }
  | { t: 'signedOut' }
  | { t: 'message'; message: ChatMessage; clientId?: string }
  | { t: 'typing'; who: 'AGENT' | 'BOT'; name: string; on: boolean }
  | { t: 'read'; by: 'AGENT'; at: string }
  | { t: 'session'; session: VisitorSession }
  | { t: 'switch'; channel: 'KNOWLEDGE' }
  | { t: 'error'; message: string; code?: string; clientId?: string }
  | { t: 'pong' };

type IdentityFrame = Identity & { pageUrl: string };

export type ClientFrame =
  | { t: 'hello'; role: 'visitor'; site: ChatSite; token?: string }
  | ({ t: 'requestCode' } & IdentityFrame)
  | ({ t: 'verifyCode'; code: string } & IdentityFrame)
  | { t: 'send'; clientId: string; channel: Channel; body: string; files: OutgoingFile[] }
  | { t: 'typing'; on: boolean }
  | { t: 'read' }
  | { t: 'end' }
  | { t: 'newChat' }
  | { t: 'getConfig' }
  | { t: 'ping' };
