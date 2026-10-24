import { recordEmailThreads } from './gmail.sync';

type Kind = 'CONTACT' | 'COMPANY';
type Thread = Awaited<ReturnType<typeof recordEmailThreads>>[number];
export type CrmEmailThreadSort = 'NEWEST' | 'OLDEST' | 'SUBJECT';

export interface CrmEmailThreadPageInput {
  search?: string | null;
  /** Threads with at least one message this way. */
  direction?: 'IN' | 'OUT' | null;
  accountId?: string | null;
  /** The thread's latest message falls on or after / before these. */
  after?: Date | string | null;
  before?: Date | string | null;
  sort?: CrmEmailThreadSort | null;
  page: number;
  pageSize: number;
}

/** The most threads one page carries. */
export const MAX_THREAD_PAGE_SIZE = 100;

/** Everything a search looks through: subjects, previews, bodies and the people on it. */
const searchableText = (thread: Thread) =>
  [
    thread.subject,
    ...thread.messages.flatMap((message) => [
      message.subject,
      message.snippet,
      message.bodyText,
      message.from,
      ...message.to,
      ...message.cc,
    ]),
  ]
    .join('\n')
    .toLowerCase();

const timeOf = (value: Date | string | null | undefined) =>
  value ? new Date(value).getTime() : null;

/** Whether one thread passes every filter of the input. */
function matches(thread: Thread, input: CrmEmailThreadPageInput, search: string) {
  const at = thread.lastAt.getTime();
  const after = timeOf(input.after);
  const before = timeOf(input.before);
  if (input.accountId && thread.accountId !== input.accountId) {
    return false;
  }
  if (input.direction && !thread.messages.some((m) => m.direction === input.direction)) {
    return false;
  }
  if ((after !== null && at < after) || (before !== null && at > before)) {
    return false;
  }
  return !search || searchableText(thread).includes(search);
}

const COMPARE: Record<CrmEmailThreadSort, (a: Thread, b: Thread) => number> = {
  NEWEST: (a, b) => b.lastAt.getTime() - a.lastAt.getTime(),
  OLDEST: (a, b) => a.lastAt.getTime() - b.lastAt.getTime(),
  SUBJECT: (a, b) => a.subject.localeCompare(b.subject),
};

/** Every mailbox the record's mail is in, once each, for the mailbox filter. */
function mailboxesOf(threads: Thread[]) {
  const seen = new Map<string, string>();
  for (const thread of threads) {
    seen.set(thread.accountId, thread.mailbox);
  }
  return [...seen].map(([accountId, mailbox]) => ({ accountId, mailbox }));
}

/**
 * One page of the record's synced email threads, searched, filtered and sorted. It reads only
 * what the CRM has stored; syncCrmEmails brings in the newest mail from Gmail.
 */
export async function crmEmailThreadPage(object: Kind, id: string, input: CrmEmailThreadPageInput) {
  const threads = await recordEmailThreads(object, id);
  const search = input.search?.trim().toLowerCase() ?? '';
  const found = threads
    .filter((thread) => matches(thread, input, search))
    .sort(COMPARE[input.sort ?? 'NEWEST']);
  const pageSize = Math.min(Math.max(input.pageSize, 1), MAX_THREAD_PAGE_SIZE);
  const page = Math.max(input.page, 0);
  return {
    rows: found.slice(page * pageSize, (page + 1) * pageSize),
    totalCount: found.length,
    mailboxes: mailboxesOf(threads),
  };
}
