import { logger } from '../../utils/logger';
import { openGmailSession } from '../gmail/gmail.client';
import type { AccountMailbox } from '../gmail/gmail.accounts';
import { explainMailError } from './crm-mail.errors';
import { folderFilter, type MailFolder } from './crm-mail.folders';
import { listThreads } from './crm-mail.gmail';
import { recordLinks } from './crm-mail.links';
import { spendMailboxCall } from './crm-mail.mailboxes';
import { CrmMailThreadModel } from './crm-mail.models';
import { ingestThreads } from './crm-mail.sync';

/** The CRM > Mail list: one page of conversations, searched in the list and in Gmail. */

export const MAX_PAGE_SIZE = 100;
/** Conversations Gmail's own search adds per mailbox: older mail the sync has not read. */
const GMAIL_SEARCH_RESULTS = 20;
/** A search repeated within this long reuses Gmail's answer instead of asking again. */
const SEARCH_CACHE_MS = 60_000;
const SEARCH_CACHE_SIZE = 500;

export type MailSort = 'NEWEST' | 'OLDEST' | 'SUBJECT' | 'SENDER';

export interface MailListInput {
  folder: MailFolder;
  search?: string | null;
  unreadOnly?: boolean | null;
  withAttachments?: boolean | null;
  after?: Date | string | null;
  before?: Date | string | null;
  sort?: MailSort | null;
  page: number;
  pageSize: number;
}

/** Each order ends on the newest first, so equal subjects or senders keep a stable order. */
const SORTS: Record<MailSort, Record<string, 1 | -1>> = {
  NEWEST: { lastAt: -1 },
  OLDEST: { lastAt: 1 },
  SUBJECT: { subject: 1, lastAt: -1 },
  SENDER: { fromName: 1, fromAddress: 1, lastAt: -1 },
};

/** The filters besides the folder and the search: unread, attachments and a date range. */
function refinements(input: MailListInput) {
  const lastAt = {
    ...(input.after ? { $gte: new Date(input.after) } : {}),
    ...(input.before ? { $lte: new Date(input.before) } : {}),
  };
  return {
    ...(input.unreadOnly ? { unread: true } : {}),
    ...(input.withAttachments ? { hasAttachments: true } : {}),
    ...(Object.keys(lastAt).length > 0 ? { lastAt } : {}),
  };
}

/** Gmail's answer to one search in one mailbox, kept briefly: typing repeats searches. */
const searchCache = new Map<string, { at: number; ids: string[] }>();

/** Test seam: forgets every cached search. */
export const clearMailSearchCache = () => searchCache.clear();

function cacheSearch(key: string, ids: string[]) {
  if (searchCache.size >= SEARCH_CACHE_SIZE) {
    const oldest = searchCache.keys().next().value;
    if (oldest !== undefined) {
      searchCache.delete(oldest);
    }
  }
  searchCache.set(key, { at: Date.now(), ids });
}

/**
 * Gmail's own search of one mailbox (bodies and older mail included), with the conversations
 * it finds read into the list. Returns their ids, or the reason Gmail refused.
 */
async function searchGmail(mailbox: AccountMailbox, search: string) {
  const key = `${mailbox.id}\n${search}`;
  const cached = searchCache.get(key);
  if (cached && Date.now() - cached.at < SEARCH_CACHE_MS) {
    return { ids: cached.ids, warning: '' };
  }
  try {
    await spendMailboxCall(mailbox);
    const call = await openGmailSession(mailbox);
    const listed = await listThreads(call, { q: search, max: GMAIL_SEARCH_RESULTS });
    await ingestThreads(call, mailbox, listed);
    const ids = listed.map((thread) => thread.id);
    cacheSearch(key, ids);
    return { ids, warning: '' };
  } catch (error) {
    logger.warn({ err: error, accountId: mailbox.id }, 'CRM mail: Gmail search failed');
    return { ids: [], warning: explainMailError(error, mailbox.email) };
  }
}

const escapeRegex = (value: string) => value.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);

/** The Mongo filter for the page: the mailboxes, the folder, and the search when there is one. */
function listFilter(
  mailboxes: AccountMailbox[],
  folder: MailFolder,
  search: string,
  found: Array<{ accountId: string; ids: string[] }>,
) {
  const base = { accountId: { $in: mailboxes.map((m) => m.id) }, ...folderFilter(folder) };
  if (search === '') {
    return base;
  }
  const pattern = { $regex: escapeRegex(search), $options: 'i' };
  return {
    ...base,
    $or: [
      { subject: pattern },
      { snippet: pattern },
      { fromName: pattern },
      { participants: pattern },
      ...found.map((hit) => ({ accountId: hit.accountId, threadId: { $in: hit.ids } })),
    ],
  };
}

/** One page of the folder across the mailboxes, filtered and sorted, with each one's CRM record. */
export async function listMailThreads(mailboxes: AccountMailbox[], input: MailListInput) {
  const search = (input.search ?? '').trim().slice(0, 200);
  const pageSize = Math.min(Math.max(Math.trunc(input.pageSize), 1), MAX_PAGE_SIZE);
  const page = Math.max(Math.trunc(input.page), 0);
  const searched =
    search === ''
      ? []
      : await Promise.all(mailboxes.map((mailbox) => searchGmail(mailbox, search)));
  const found = searched.map((hit, index) => ({ accountId: mailboxes[index].id, ids: hit.ids }));
  const filter = { ...listFilter(mailboxes, input.folder, search, found), ...refinements(input) };
  const [rows, totalCount] = await Promise.all([
    CrmMailThreadModel.find(filter)
      .sort(SORTS[input.sort ?? 'NEWEST'])
      .skip(page * pageSize)
      .limit(pageSize)
      .lean(),
    CrmMailThreadModel.countDocuments(filter),
  ]);
  const own = new Set(mailboxes.map((mailbox) => mailbox.email));
  const links = await recordLinks(rows, own);
  return {
    rows: rows.map((row, index) => ({ ...row, record: links[index] })),
    totalCount,
    warnings: [...new Set(searched.map((hit) => hit.warning).filter(Boolean))],
  };
}
