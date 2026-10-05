import type { Channel, ChatMessage } from '../types';
import type { ThreadItem, Threads } from './state';

const sent = (key: string, message: ChatMessage): ThreadItem => ({
  key,
  message,
  status: 'sent',
  files: [],
});

/** The server's history, split by thread. */
export function threadsFrom(messages: readonly ChatMessage[]): Record<Channel, ThreadItem[]> {
  const threads: Record<Channel, ThreadItem[]> = { LIVE: [], KNOWLEDGE: [] };
  for (const message of messages) {
    threads[message.channel].push(sent(message.id, message));
  }
  return threads;
}

/** History from the server plus the bubbles that never reached it, so a retry is not lost. */
export function mergeHistory(history: readonly ChatMessage[], local: Threads): Threads {
  const threads = threadsFrom(history);
  for (const channel of ['LIVE', 'KNOWLEDGE'] as const) {
    threads[channel].push(...local[channel].filter((item) => item.status === 'failed'));
  }
  return threads;
}

/**
 * Adds a message, or replaces the optimistic bubble it echoes (same clientId) or a copy already
 * shown (same id). `added` is false when it only replaced.
 */
export function upsertMessage(
  items: readonly ThreadItem[],
  message: ChatMessage,
  clientId?: string,
): { items: ThreadItem[]; added: boolean } {
  const index = items.findIndex(
    (item) => (clientId !== undefined && item.key === clientId) || item.message.id === message.id,
  );
  if (index === -1) {
    return { items: [...items, sent(clientId ?? message.id, message)], added: true };
  }
  const next = [...items];
  next[index] = sent(items[index].key, message);
  return { items: next, added: false };
}

export function withStatus(
  items: readonly ThreadItem[],
  key: string,
  status: ThreadItem['status'],
): ThreadItem[] {
  return items.map((item) => (item.key === key ? { ...item, status } : item));
}

/** Every bubble still waiting for the server, marked failed (the socket dropped or refused it). */
export function failPending(threads: Threads): Threads {
  const fail = (items: readonly ThreadItem[]) =>
    items.map((item) =>
      item.status === 'sending' ? { ...item, status: 'failed' as const } : item,
    );
  return { LIVE: fail(threads.LIVE), KNOWLEDGE: fail(threads.KNOWLEDGE) };
}

/** The team read the visitor's live messages at `at`. */
export function markVisitorRead(items: readonly ThreadItem[], at: string): ThreadItem[] {
  return items.map((item) =>
    item.message.sender === 'VISITOR' && item.message.readAt === null
      ? { ...item, message: { ...item.message, readAt: at } }
      : item,
  );
}

export const isReply = (message: ChatMessage): boolean =>
  message.sender === 'AGENT' || message.sender === 'BOT';

/** Replies (agent or bot) the visitor has not seen yet. */
export function countUnread(messages: readonly ChatMessage[]): number {
  return messages.filter((message) => isReply(message) && message.readAt === null).length;
}
