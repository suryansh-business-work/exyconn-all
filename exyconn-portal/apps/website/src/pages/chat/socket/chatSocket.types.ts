import type {
  WebsiteChatMessageFieldsFragment,
  WebsiteChatSessionFieldsFragment,
} from '@exyconn/shell/graphql/generated';

/** One chat message as the socket sends it: the same shape as the GraphQL fragment. */
export type ChatMessage = WebsiteChatMessageFieldsFragment;

/** One chat session as the socket sends it to the console. */
export type ChatSession = WebsiteChatSessionFieldsFragment;

/** A file sent with a reply: a data URL whose MIME type carries no parameters. */
export interface ChatFileFrame {
  name: string;
  data: string;
}

/** What the console sends (the staff half of the chat socket protocol). */
export type StaffClientFrame =
  | { t: 'watch'; sessionId: string | null }
  | { t: 'send'; sessionId: string; clientId: string; body: string; files: ChatFileFrame[] }
  | { t: 'typing'; sessionId: string; on: boolean }
  | { t: 'read'; sessionId: string };

/** What the server sends the console. */
export type StaffServerFrame =
  | { t: 'ready' }
  | { t: 'message'; message: ChatMessage; clientId?: string }
  | { t: 'session'; session: ChatSession }
  | { t: 'typing'; sessionId: string; who: 'VISITOR'; name: string; on: boolean }
  | { t: 'read'; sessionId: string; by: 'VISITOR'; at: string }
  | { t: 'error'; message: string; code?: string; clientId?: string }
  | { t: 'pong' };

/** Where the console's socket is: signing in, signed in and live, or waiting to retry. */
export type ChatConnection = 'connecting' | 'ready' | 'offline';

export type FrameListener = (frame: StaffServerFrame) => void;
