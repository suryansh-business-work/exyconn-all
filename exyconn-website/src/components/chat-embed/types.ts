/**
 * The website chat's socket protocol, visitor side. The server is
 * exyconn-portal/server/src/modules/website-chat (chat.socket.visitor.ts, chat.validation.ts,
 * chat.serialize.ts); these shapes mirror what it sends and accepts.
 */

export type ChatSite = "WEBSITE" | "TOOLS";
export type Channel = "LIVE" | "KNOWLEDGE";
export type Sender = "VISITOR" | "AGENT" | "BOT" | "SYSTEM";
export type AttachmentKind = "IMAGE" | "VIDEO" | "AUDIO";
export type SessionStatus = "OPEN" | "CLOSED";
export type Feedback = "UP" | "DOWN";
export type ColorMode = "light" | "dark";

export interface ChatAttachment {
  url: string;
  name: string;
  kind: AttachmentKind;
  size: number;
}

export interface ChatSource {
  title: string;
  url: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  channel: Channel;
  sender: Sender;
  senderName: string;
  body: string;
  attachments: ChatAttachment[];
  /** Pages a BOT answer used. */
  sources: ChatSource[];
  /** Follow-up questions a BOT answer offers. */
  suggestions: string[];
  feedback: Feedback | null;
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
  /** '' while nobody on the team has the chat. */
  agentName: string;
  /** When the chat closes if neither side writes; null when it does not time out. */
  expiresAt: string | null;
  createdAt: string;
  closedAt: string | null;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface OpeningDay {
  day: number;
  enabled: boolean;
  start: string;
  end: string;
}

export interface WidgetConfig {
  enabled: boolean;
  botName: string;
  welcomeMessage: string;
  offlineMessage: string;
  online: boolean;
  timezone: string;
  weeklyHours: OpeningDay[];
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
  | { t: "config"; config: WidgetConfig; site: ChatSite }
  | { t: "codeSent"; email: string }
  | { t: "signedIn"; token: string; session: VisitorSession; messages: ChatMessage[] }
  | { t: "signedOut" }
  | { t: "message"; message: ChatMessage; clientId?: string }
  | { t: "messageUpdated"; message: ChatMessage }
  | { t: "typing"; who: "AGENT" | "BOT"; name: string; on: boolean; channel?: Channel }
  | { t: "read"; by: "AGENT"; at: string }
  | { t: "session"; session: VisitorSession }
  | { t: "error"; message: string; code?: string; clientId?: string }
  | { t: "pong" };

type IdentityFrame = Identity & { pageUrl: string };

export type ClientFrame =
  | { t: "hello"; role: "visitor"; site: ChatSite; token?: string }
  | ({ t: "requestCode" } & IdentityFrame)
  | ({ t: "verifyCode"; code: string } & IdentityFrame)
  | { t: "send"; clientId: string; channel: Channel; body: string; files: OutgoingFile[] }
  | { t: "typing"; on: boolean }
  | { t: "read" }
  | { t: "feedback"; messageId: string; helpful: boolean }
  | { t: "end" }
  | { t: "newChat" }
  | { t: "getConfig" }
  | { t: "ping" };
