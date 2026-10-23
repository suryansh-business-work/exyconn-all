import { useParams, useSearchParams } from 'react-router-dom';
import { folderBySlug, MAIL_PATH } from './mailFolders';

/** The conversation open in the reader. */
export interface OpenThread {
  accountId: string;
  threadId: string;
}

/** What the address can carry besides the folder; `null` clears a value. */
export interface MailRouteChange {
  mailbox?: string | null;
  q?: string | null;
  page?: number | null;
  thread?: OpenThread | null;
}

const THREAD_SEPARATOR = ':';

/** A conversation as the address names it: its mailbox and Gmail thread id. */
const threadKey = (thread: OpenThread) =>
  [thread.accountId, thread.threadId].join(THREAD_SEPARATOR);

/** The first page is the address without one. */
function pageValue(page: number | null | undefined) {
  if (page === undefined) {
    return undefined;
  }
  return page ? String(page) : null;
}

/** A folder's address, keeping the chosen mailbox (search, page and reader start over). */
export function folderHref(slug: string, mailbox: string) {
  const query = mailbox ? `?${new URLSearchParams({ mailbox }).toString()}` : '';
  return `${MAIL_PATH}/${slug}${query}`;
}

/**
 * Everything CRM > Mail is looking at, kept in the address so a link (or Back) brings the
 * same view: the folder as the path's slug, and the mailbox, search, page and open
 * conversation as query values.
 */
export function useMailRoute() {
  const { folder: slug } = useParams();
  const [params, setParams] = useSearchParams();
  const folder = folderBySlug(slug);
  const threadValue = params.get('thread') ?? '';
  const split = threadValue.indexOf(THREAD_SEPARATOR);
  const thread: OpenThread | null =
    split > 0
      ? { accountId: threadValue.slice(0, split), threadId: threadValue.slice(split + 1) }
      : null;

  const change = (next: MailRouteChange) => {
    const updated = new URLSearchParams(params);
    const set = (key: string, value: string | null | undefined) => {
      if (value === undefined) {
        return;
      }
      if (value === null || value === '') {
        updated.delete(key);
      } else {
        updated.set(key, value);
      }
    };
    set('mailbox', next.mailbox);
    set('q', next.q);
    set('page', pageValue(next.page));
    if (next.thread !== undefined) {
      set('thread', next.thread && threadKey(next.thread));
    }
    setParams(updated);
  };

  return {
    folder,
    mailbox: params.get('mailbox') ?? '',
    search: params.get('q') ?? '',
    page: Math.max(Number.parseInt(params.get('page') ?? '0', 10) || 0, 0),
    thread,
    change,
  };
}
