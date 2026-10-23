import { badRequest } from '../../utils/errors';
import { openGmailSession, type GmailCall } from '../gmail/gmail.client';
import type { AccountMailbox } from '../gmail/gmail.accounts';
import { mapLimit, modifyThread, trashThread } from './crm-mail.gmail';
import { spendMailboxCall } from './crm-mail.mailboxes';
import { CrmMailThreadModel } from './crm-mail.models';
import { GMAIL_CONCURRENCY } from './crm-mail.sync';

/** Marking, starring, archiving and trashing conversations, in Gmail and then in the list. */

export const MAIL_ACTIONS = [
  'MARK_READ',
  'MARK_UNREAD',
  'STAR',
  'UNSTAR',
  'ARCHIVE',
  'TRASH',
] as const;
export type MailAction = (typeof MAIL_ACTIONS)[number];

/** Conversations one action may change at once. */
export const MAX_ACTION_THREADS = 100;

export interface MailThreadRef {
  accountId: string;
  threadId: string;
}

type LabelAction = Exclude<MailAction, 'TRASH'>;

/** The Gmail label each action adds or removes, and the stored flags that follow from it. */
const LABEL_CHANGES: Readonly<
  Record<LabelAction, { label: string; add: boolean; flags: Record<string, boolean> }>
> = {
  MARK_READ: { label: 'UNREAD', add: false, flags: { unread: false } },
  MARK_UNREAD: { label: 'UNREAD', add: true, flags: { unread: true } },
  STAR: { label: 'STARRED', add: true, flags: { starred: true } },
  UNSTAR: { label: 'STARRED', add: false, flags: { starred: false } },
  ARCHIVE: { label: 'INBOX', add: false, flags: {} },
};

/** Changes one conversation in Gmail, then its list row. */
async function applyOne(call: GmailCall, accountId: string, threadId: string, action: MailAction) {
  const row = { accountId, threadId };
  if (action === 'TRASH') {
    await trashThread(call, threadId);
    await CrmMailThreadModel.deleteOne(row);
    return;
  }
  const change = LABEL_CHANGES[action];
  await modifyThread(call, threadId, {
    add: change.add ? [change.label] : [],
    remove: change.add ? [] : [change.label],
  });
  const labels = change.add
    ? { $addToSet: { labelIds: change.label } }
    : { $pull: { labelIds: change.label } };
  await CrmMailThreadModel.updateOne(row, { ...labels, $set: change.flags });
}

export interface ActionOutcome {
  email: string;
  /** Conversations Gmail changed. */
  changed: number;
  /** The first refusal, when any conversation could not be changed; null when all were. */
  failure: unknown;
}

/** Applies the action to one mailbox's conversations, carrying on past a refusal. */
async function applyInMailbox(
  mailbox: AccountMailbox,
  threadIds: string[],
  action: MailAction,
): Promise<ActionOutcome> {
  const email = mailbox.email;
  let call: GmailCall;
  try {
    await spendMailboxCall(mailbox);
    call = await openGmailSession(mailbox);
  } catch (error) {
    return { email, changed: 0, failure: error };
  }
  const outcomes = await mapLimit(threadIds, GMAIL_CONCURRENCY, (threadId) =>
    applyOne(call, mailbox.id, threadId, action).then(
      () => null,
      (error: unknown) => error,
    ),
  );
  const failures = outcomes.filter((outcome) => outcome !== null);
  return { email, changed: threadIds.length - failures.length, failure: failures[0] ?? null };
}

/**
 * Applies the action to every conversation, mailbox by mailbox. Every conversation must be in
 * one of the readable mailboxes. Never throws for Gmail's refusals: each mailbox's outcome says
 * how many changed and the first refusal, so the caller can audit what did change.
 */
export async function applyMailAction(
  readable: AccountMailbox[],
  threads: MailThreadRef[],
  action: MailAction,
): Promise<ActionOutcome[]> {
  if (threads.length === 0 || threads.length > MAX_ACTION_THREADS) {
    badRequest(`Choose between 1 and ${MAX_ACTION_THREADS} conversations.`);
  }
  const byAccount = new Map<string, string[]>();
  for (const thread of threads) {
    byAccount.set(thread.accountId, [...(byAccount.get(thread.accountId) ?? []), thread.threadId]);
  }
  const groups = [...byAccount].map(([accountId, threadIds]) => {
    const mailbox = readable.find((candidate) => candidate.id === accountId);
    if (!mailbox) {
      badRequest('Choose a connected Gmail mailbox that is turned on for the CRM.');
    }
    return { mailbox, threadIds: [...new Set(threadIds)] };
  });
  const outcomes: ActionOutcome[] = [];
  for (const group of groups) {
    outcomes.push(await applyInMailbox(group.mailbox, group.threadIds, action));
  }
  return outcomes;
}
