import type { GmailCall, GmailMessage } from '../gmail/gmail.client';

/** The Gmail API calls CRM > Mail makes, each on one session's access token. */

/** The headers a list row needs; the bodies are read only when a conversation is opened. */
const METADATA_HEADERS = ['From', 'To', 'Cc', 'Subject', 'Message-ID'];

export interface ListedThread {
  id: string;
  historyId: string;
}

export interface ThreadListQuery {
  /** e.g. ['INBOX']; none lists every conversation except spam and trash. */
  labelIds?: string[];
  /** A Gmail search, e.g. "invoice from:asha@acme.io". */
  q?: string;
  max: number;
}

/** The newest conversations matching the query, with Gmail's change marker for each. */
export async function listThreads(call: GmailCall, query: ThreadListQuery) {
  const params = new URLSearchParams({ maxResults: String(query.max) });
  for (const label of query.labelIds ?? []) {
    params.append('labelIds', label);
  }
  if (query.q) {
    params.set('q', query.q);
  }
  const page = await call<{ threads?: ListedThread[] }>(`/threads?${params.toString()}`);
  return page.threads ?? [];
}

/** A conversation's messages with headers and labels only. */
export async function threadMetadata(call: GmailCall, id: string) {
  const params = new URLSearchParams({ format: 'metadata' });
  for (const header of METADATA_HEADERS) {
    params.append('metadataHeaders', header);
  }
  const thread = await call<{ historyId?: string; messages?: GmailMessage[] }>(
    `/threads/${encodeURIComponent(id)}?${params.toString()}`,
  );
  return { historyId: thread.historyId ?? '', messages: thread.messages ?? [] };
}

/** A conversation with every message in full (bodies and attachment parts). */
export async function threadFull(call: GmailCall, id: string) {
  const thread = await call<{ historyId?: string; messages?: GmailMessage[] }>(
    `/threads/${encodeURIComponent(id)}?format=full`,
  );
  return { historyId: thread.historyId ?? '', messages: thread.messages ?? [] };
}

/** Adds and removes labels on every message of a conversation (read, star, archive). */
export const modifyThread = (
  call: GmailCall,
  id: string,
  change: { add: string[]; remove: string[] },
) =>
  call<unknown>(`/threads/${encodeURIComponent(id)}/modify`, {
    method: 'POST',
    body: JSON.stringify({ addLabelIds: change.add, removeLabelIds: change.remove }),
  });

/** Moves a conversation to Gmail's trash, where Gmail keeps it for 30 days. */
export const trashThread = (call: GmailCall, id: string) =>
  call<unknown>(`/threads/${encodeURIComponent(id)}/trash`, { method: 'POST' });

/** One attachment's bytes, base64url-encoded as Gmail sends them. */
export const attachmentData = (call: GmailCall, messageId: string, attachmentId: string) =>
  call<{ data?: string; size?: number }>(
    `/messages/${encodeURIComponent(messageId)}/attachments/${encodeURIComponent(attachmentId)}`,
  );

/**
 * Runs `work` over `items` with at most `limit` in flight, so a sync of many conversations
 * stays inside Gmail's per-user rate limit. Results keep the items' order.
 */
export async function mapLimit<T, R>(
  items: T[],
  limit: number,
  work: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array<R>(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await work(items[index]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
