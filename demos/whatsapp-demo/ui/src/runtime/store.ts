/**
 * Every chat in one place: transcript, engine state, unread count, typing, and the pushes
 * still to arrive. Pure reducer; the runtime hook owns the timers.
 */
import type { ChatMessage, ChatState, MessageStatus, PendingPush } from '@exyconn/wa-flow';

/** Longest transcript kept per chat. */
const MAX_MESSAGES = 400;

export interface ChatRecord {
  state: ChatState;
  messages: ChatMessage[];
  unread: number;
  /** Catalog revision the chat last ran against. */
  revision?: string;
}

export interface ChatStore {
  chats: Record<string, ChatRecord>;
  pending: PendingPush[];
  /** Chats showing "typing…" right now (never persisted). */
  typing: Record<string, boolean>;
}

export const EMPTY_STORE: ChatStore = { chats: {}, pending: [], typing: {} };

export type StoreAction =
  | { type: 'reset'; demoKey: string; state: ChatState; revision?: string }
  | { type: 'state'; demoKey: string; state: ChatState }
  | { type: 'append'; demoKey: string; message: ChatMessage; unread: boolean }
  | { type: 'status'; demoKey: string; id: string; status: MessageStatus }
  | { type: 'typing'; demoKey: string; typing: boolean }
  | { type: 'read'; demoKey: string }
  | { type: 'revision'; demoKey: string; revision: string }
  | { type: 'schedule'; pushes: PendingPush[] }
  | { type: 'unschedule'; ids: string[] }
  | { type: 'unscheduleDemo'; demoKey: string };

function patch(
  store: ChatStore,
  demoKey: string,
  change: (chat: ChatRecord) => ChatRecord,
): ChatStore {
  const chat = store.chats[demoKey];
  return chat ? { ...store, chats: { ...store.chats, [demoKey]: change(chat) } } : store;
}

const STATUS_ORDER: Readonly<Record<MessageStatus, number>> = { sent: 0, delivered: 1, read: 2 };

export function chatReducer(store: ChatStore, action: StoreAction): ChatStore {
  switch (action.type) {
    case 'reset':
      return {
        ...store,
        chats: {
          ...store.chats,
          [action.demoKey]: {
            state: action.state,
            messages: [],
            unread: 0,
            revision: action.revision,
          },
        },
      };
    case 'state':
      return patch(store, action.demoKey, (chat) => ({ ...chat, state: action.state }));
    case 'append':
      return patch(store, action.demoKey, (chat) => ({
        ...chat,
        messages: [...chat.messages, action.message].slice(-MAX_MESSAGES),
        unread: action.unread ? chat.unread + 1 : chat.unread,
      }));
    case 'status':
      return patch(store, action.demoKey, (chat) => ({
        ...chat,
        messages: chat.messages.map((m) =>
          m.id === action.id && STATUS_ORDER[action.status] > STATUS_ORDER[m.status ?? 'sent']
            ? { ...m, status: action.status }
            : m,
        ),
      }));
    case 'typing':
      return { ...store, typing: { ...store.typing, [action.demoKey]: action.typing } };
    case 'read':
      return patch(store, action.demoKey, (chat) => (chat.unread ? { ...chat, unread: 0 } : chat));
    case 'revision':
      return patch(store, action.demoKey, (chat) => ({ ...chat, revision: action.revision }));
    case 'schedule':
      return { ...store, pending: [...store.pending, ...action.pushes] };
    case 'unschedule':
      return { ...store, pending: store.pending.filter((p) => !action.ids.includes(p.id)) };
    default:
      return { ...store, pending: store.pending.filter((p) => p.demoKey !== action.demoKey) };
  }
}

/** The customer's messages still waiting for blue ticks. */
export function unreadByBusiness(chat: ChatRecord): ChatMessage[] {
  return chat.messages.filter((m) => m.from === 'user' && m.status !== 'read');
}
