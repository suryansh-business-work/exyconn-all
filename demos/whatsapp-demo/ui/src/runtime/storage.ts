/**
 * Each viewer's chats, kept in their own browser (a per-viewer convenience — analytics go to
 * the server separately). Every read and write is guarded: private windows and blocked
 * storage simply start a fresh chat.
 */
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import type { ChatStore } from './store';

const PREFIX = 'exyconn.wa-demo.v1.';

type Persisted = Pick<ChatStore, 'chats' | 'pending'>;

export function loadChats(userId: string): Persisted | null {
  try {
    const raw = globalThis.localStorage.getItem(PREFIX + userId);
    return raw ? (JSON.parse(raw) as Persisted) : null;
  } catch (error) {
    portalLogger.warn('wa-demo: could not read saved chats', error);
    return null;
  }
}

export function saveChats(userId: string, store: ChatStore): void {
  try {
    const persisted: Persisted = { chats: store.chats, pending: store.pending };
    globalThis.localStorage.setItem(PREFIX + userId, JSON.stringify(persisted));
  } catch (error) {
    portalLogger.warn('wa-demo: could not save chats', error);
  }
}
