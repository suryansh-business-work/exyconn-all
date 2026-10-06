import type { Channel, ChatMessage } from "../types";
import type { ItemStatus, ThreadItem, Threads } from "./state";

const CHANNELS: readonly Channel[] = ["LIVE", "KNOWLEDGE"];

const sent = (key: string, message: ChatMessage): ThreadItem => ({
  key,
  message,
  status: "sent",
  files: [],
});

/** The server's history, split by thread: each message only ever lives in its own thread. */
function threadsFrom(messages: readonly ChatMessage[]): Record<Channel, ThreadItem[]> {
  const threads: Record<Channel, ThreadItem[]> = { LIVE: [], KNOWLEDGE: [] };
  for (const message of messages) {
    threads[message.channel].push(sent(message.id, message));
  }
  return threads;
}

/** History from the server plus the bubbles that never reached it, so a retry is not lost. */
export function mergeHistory(history: readonly ChatMessage[], local: Threads): Threads {
  const threads = threadsFrom(history);
  for (const channel of CHANNELS) {
    threads[channel].push(...local[channel].filter((item) => item.status === "failed"));
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
  clientId?: string
): { items: ThreadItem[]; added: boolean } {
  const index = items.findIndex(
    (item) => (clientId !== undefined && item.key === clientId) || item.message.id === message.id
  );
  if (index === -1) {
    return { items: [...items, sent(clientId ?? message.id, message)], added: true };
  }
  const next = [...items];
  next[index] = sent(items[index].key, message);
  return { items: next, added: false };
}

/** The same message, changed (its feedback was recorded): swapped in wherever it is shown. */
export function replaceMessage(threads: Threads, message: ChatMessage): Threads {
  const swap = (items: readonly ThreadItem[]) =>
    items.map((item) => (item.message.id === message.id ? { ...item, message } : item));
  return { LIVE: swap(threads.LIVE), KNOWLEDGE: swap(threads.KNOWLEDGE) };
}

export function withStatus(
  items: readonly ThreadItem[],
  key: string,
  status: ItemStatus
): ThreadItem[] {
  return items.map((item) => (item.key === key ? { ...item, status, error: undefined } : item));
}

/** The message an error names, marked failed (with the reason) in whichever thread holds it. */
export function failOne(threads: Threads, clientId: string, error: string): Threads {
  const fail = (items: readonly ThreadItem[]) =>
    items.map((item) =>
      item.key === clientId ? { ...item, status: "failed" as const, error } : item
    );
  return { LIVE: fail(threads.LIVE), KNOWLEDGE: fail(threads.KNOWLEDGE) };
}

/** Every bubble still waiting for the server, marked failed (the socket dropped or refused it). */
export function failPending(threads: Threads): Threads {
  const fail = (items: readonly ThreadItem[]) =>
    items.map((item) =>
      item.status === "sending" ? { ...item, status: "failed" as const } : item
    );
  return { LIVE: fail(threads.LIVE), KNOWLEDGE: fail(threads.KNOWLEDGE) };
}

/** The team read the visitor's live messages at `at`. */
export function markVisitorRead(items: readonly ThreadItem[], at: string): ThreadItem[] {
  return items.map((item) =>
    item.message.sender === "VISITOR" && item.message.readAt === null
      ? { ...item, message: { ...item.message, readAt: at } }
      : item
  );
}

export const isReply = (message: Readonly<ChatMessage>): boolean =>
  message.sender === "AGENT" || message.sender === "BOT";

/** Replies (agent or bot) the visitor has not seen yet. */
export function countUnread(messages: readonly ChatMessage[]): number {
  return messages.filter((message) => isReply(message) && message.readAt === null).length;
}
