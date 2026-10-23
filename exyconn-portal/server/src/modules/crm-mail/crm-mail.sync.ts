import { logger } from '../../utils/logger';
import { openGmailSession, type GmailCall } from '../gmail/gmail.client';
import { noteAccountOutcome, type AccountMailbox } from '../gmail/gmail.accounts';
import { GmailAccountModel } from '../gmail/gmail.models';
import { explainMailError } from './crm-mail.errors';
import { listThreads, mapLimit, threadMetadata, type ListedThread } from './crm-mail.gmail';
import { spendMailboxCall } from './crm-mail.mailboxes';
import { changedThreads, reconcileFolder, saveThread } from './crm-mail.store';

/**
 * Reads a mailbox's newest conversations into the CRM > Mail list. Each sync lists the newest
 * page of every folder, then reads only the conversations Gmail says changed since last time
 * (its historyId), a few at a time, so a mailbox is cheap to keep current.
 */

/** The newest conversations read per folder; `null` is All mail (everything but spam and trash). */
const FOLDERS: ReadonlyArray<{ label: string | null; max: number }> = [
  { label: 'INBOX', max: 50 },
  { label: 'SENT', max: 25 },
  { label: 'STARRED', max: 25 },
  { label: null, max: 50 },
];
/** A mailbox is synced at most this often, however many people press Sync now. */
export const MIN_SYNC_INTERVAL_MS = 30_000;
/** Conversations read from Gmail at once, inside its per-user rate limit. */
export const GMAIL_CONCURRENCY = 4;

export interface SyncOutcome {
  accountId: string;
  email: string;
  syncedAt: Date | null;
  /** Why it failed, in words that say what to do; '' when it worked. */
  error: string;
  /** It was synced moments ago, so this request left it alone. */
  skipped: boolean;
}

/** Reads the conversations among `listed` that changed into the list. */
export async function ingestThreads(
  call: GmailCall,
  mailbox: AccountMailbox,
  listed: ListedThread[],
) {
  const changed = await changedThreads(mailbox, listed);
  await mapLimit(changed, GMAIL_CONCURRENCY, async (thread) => {
    const read = await threadMetadata(call, thread.id);
    await saveThread(mailbox, {
      threadId: thread.id,
      historyId: read.historyId || thread.historyId,
      messages: read.messages,
    });
  });
}

/**
 * Claims the mailbox's next sync: sets its sync time unless it synced within the interval.
 * The claim is one atomic update, so two people pressing Sync now start one sync. Returns
 * the previous sync time, or undefined when the claim was refused.
 */
async function claimSync(id: string) {
  const now = new Date();
  const before = await GmailAccountModel.findOneAndUpdate(
    {
      _id: id,
      $or: [
        { mailSyncedAt: null },
        { mailSyncedAt: { $lt: new Date(now.getTime() - MIN_SYNC_INTERVAL_MS) } },
      ],
    },
    { $set: { mailSyncedAt: now } },
  )
    .select('mailSyncedAt')
    .lean();
  return before ? { previous: before.mailSyncedAt ?? null, now } : undefined;
}

async function readFolders(mailbox: AccountMailbox) {
  await spendMailboxCall(mailbox);
  const call = await openGmailSession(mailbox);
  const lists = await Promise.all(
    FOLDERS.map((folder) =>
      listThreads(call, { labelIds: folder.label ? [folder.label] : [], max: folder.max }),
    ),
  );
  await ingestThreads(call, mailbox, lists.flat());
  await Promise.all(
    FOLDERS.map((folder, index) =>
      reconcileFolder(
        mailbox,
        folder.label,
        lists[index].map((thread) => thread.id),
        lists[index].length >= folder.max,
      ),
    ),
  );
}

/** Syncs one mailbox; a failure stays with it (and is noted on the account), never thrown. */
export async function syncMailbox(mailbox: AccountMailbox): Promise<SyncOutcome> {
  const base = { accountId: mailbox.id, email: mailbox.email };
  const claim = await claimSync(mailbox.id);
  if (!claim) {
    const current = await GmailAccountModel.findById(mailbox.id).select('mailSyncedAt').lean();
    return { ...base, syncedAt: current?.mailSyncedAt ?? null, error: '', skipped: true };
  }
  try {
    await readFolders(mailbox);
    await noteAccountOutcome(mailbox.id, null);
    return { ...base, syncedAt: claim.now, error: '', skipped: false };
  } catch (error) {
    logger.warn({ err: error, accountId: mailbox.id }, 'CRM mail: mailbox sync failed');
    await GmailAccountModel.updateOne(
      { _id: mailbox.id },
      { $set: { mailSyncedAt: claim.previous } },
    );
    await noteAccountOutcome(mailbox.id, error);
    const reason = explainMailError(error, mailbox.email);
    return { ...base, syncedAt: claim.previous, error: reason, skipped: false };
  }
}

export const syncMailboxes = (mailboxes: AccountMailbox[]) =>
  Promise.all(mailboxes.map((mailbox) => syncMailbox(mailbox)));
