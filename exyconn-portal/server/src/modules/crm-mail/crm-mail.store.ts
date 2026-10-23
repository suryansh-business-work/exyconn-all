import type { GmailMessage } from '../gmail/gmail.client';
import type { AccountMailbox } from '../gmail/gmail.accounts';
import { CrmMailThreadModel } from './crm-mail.models';
import { threadSummary } from './crm-mail.parse';

/** Writing conversations into the CRM > Mail list. */

export interface ReadThread {
  threadId: string;
  historyId: string;
  messages: GmailMessage[];
}

/**
 * Keeps one conversation's list row, read from Gmail just now. One upsert per conversation
 * (never bulkWrite, which the tenancy plugin does not scope); a conversation Gmail returned
 * no messages for is left alone.
 */
export async function saveThread(mailbox: AccountMailbox, thread: ReadThread) {
  if (thread.messages.length === 0) {
    return null;
  }
  const summary = threadSummary(thread.messages, mailbox);
  await CrmMailThreadModel.updateOne(
    { accountId: mailbox.id, threadId: thread.threadId },
    { $set: { ...summary, threadId: thread.threadId, historyId: thread.historyId } },
    { upsert: true },
  );
  return summary;
}

/** The ids among `threadIds` whose stored change marker differs from Gmail's (or are new). */
export async function changedThreads(
  mailbox: AccountMailbox,
  listed: Array<{ id: string; historyId: string }>,
) {
  const unique = [...new Map(listed.map((thread) => [thread.id, thread])).values()];
  const known = await CrmMailThreadModel.find({
    accountId: mailbox.id,
    threadId: { $in: unique.map((thread) => thread.id) },
  })
    .select('threadId historyId')
    .lean();
  const markers = new Map(known.map((row) => [row.threadId, row.historyId]));
  return unique.filter((thread) => markers.get(thread.id) !== thread.historyId);
}

/**
 * Takes a folder's label off the stored conversations Gmail no longer lists in it (archived,
 * unstarred or deleted elsewhere). Only conversations as new as the oldest one listed are
 * judged: older ones were beyond the page read, not removed. With no label (All mail) a
 * conversation missing from Gmail is gone, so its row is deleted.
 */
export async function reconcileFolder(
  mailbox: AccountMailbox,
  label: string | null,
  listedIds: string[],
  full: boolean,
) {
  let since = new Date(0);
  if (full) {
    const oldest = await CrmMailThreadModel.findOne({
      accountId: mailbox.id,
      threadId: { $in: listedIds },
    })
      .sort({ lastAt: 1 })
      .select('lastAt')
      .lean();
    since = oldest?.lastAt ?? since;
  }
  const stale = { accountId: mailbox.id, threadId: { $nin: listedIds }, lastAt: { $gte: since } };
  if (label === null) {
    await CrmMailThreadModel.deleteMany(stale);
    return;
  }
  const flags = label === 'STARRED' ? { $set: { starred: false } } : {};
  await CrmMailThreadModel.updateMany(
    { ...stale, labelIds: label },
    { $pull: { labelIds: label }, ...flags },
  );
}
