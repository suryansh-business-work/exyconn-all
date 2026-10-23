import { badRequest } from '../../utils/errors';
import { createLimiter, enforceLimit } from '../../lib/rateLimiter';
import { enabledMailboxes, ORG_MAILBOXES, type AccountMailbox } from '../gmail/gmail.accounts';
import { GmailAccountModel, type GmailAccountDocument } from '../gmail/gmail.models';
import {
  MicrosoftMailAccountModel,
  type MicrosoftMailAccountDocument,
} from '../microsoft-mail/microsoft.models';
import { CrmMailThreadModel } from './crm-mail.models';
import { folderFilter, MAIL_FOLDERS } from './crm-mail.folders';

/**
 * Which mailboxes CRM > Mail shows and reads. Every CRM user of the company sees every mailbox
 * turned on for the CRM ("Use for CRM" in CRM > Integrations > Email): there is no per-mailbox
 * owner. Gmail mailboxes are read and changed through the Gmail API; Microsoft ones are
 * connected to send only (Mail.Send), so they are listed but cannot be read here.
 */

/** Gmail calls one mailbox may take per minute across everyone in the company. */
const mailboxLimiter = createLimiter({ keyPrefix: 'crm-mail', points: 120, durationSec: 60 });

/** Spends one of the mailbox's Gmail calls, refusing once the minute's share is gone. */
export const spendMailboxCall = (mailbox: Pick<AccountMailbox, 'id'>) =>
  enforceLimit(mailboxLimiter, mailbox.id, 'requests to this mailbox');

/** The Gmail mailboxes the list may read: turned on for the CRM and still connected. */
export const readableMailboxes = (): Promise<AccountMailbox[]> => enabledMailboxes();

/** The mailboxes a call works on: the one asked for, or every readable one. */
export async function mailboxesFor(accountId?: string | null): Promise<AccountMailbox[]> {
  const mailboxes = await readableMailboxes();
  if (!accountId) {
    return mailboxes;
  }
  const chosen = mailboxes.find((mailbox) => mailbox.id === accountId);
  if (!chosen) {
    badRequest('Choose a connected Gmail mailbox that is turned on for the CRM.');
  }
  return [chosen];
}

const newestFirst = { connectedAt: -1 } as const;

const unreadInbox = (accountId: string) =>
  CrmMailThreadModel.countDocuments({ accountId, labelIds: 'INBOX', unread: true });

/** Every mailbox turned on for the CRM, Gmail first, with its unread inbox count. */
export async function mailMailboxes() {
  const [gmail, microsoft] = await Promise.all([
    GmailAccountModel.find({ enabled: true, ...ORG_MAILBOXES })
      .sort(newestFirst)
      .lean<GmailAccountDocument[]>(),
    MicrosoftMailAccountModel.find({ enabled: true, ...ORG_MAILBOXES })
      .sort(newestFirst)
      .lean<MicrosoftMailAccountDocument[]>(),
  ]);
  const unread = await Promise.all(gmail.map((account) => unreadInbox(account._id.toHexString())));
  return [
    ...gmail.map((account, index) => ({
      id: account._id.toHexString(),
      email: account.email,
      provider: 'GMAIL' as const,
      readable: account.status === 'CONNECTED',
      status: account.status,
      lastError: account.lastError,
      lastSyncedAt: account.mailSyncedAt ?? null,
      unreadCount: unread[index],
    })),
    ...microsoft.map((account) => ({
      id: account._id.toHexString(),
      email: account.email,
      provider: 'MICROSOFT' as const,
      readable: false,
      status: account.status,
      lastError: account.lastError,
      lastSyncedAt: null,
      unreadCount: 0,
    })),
  ];
}

/** How many unread conversations each folder holds across the given mailboxes. */
export async function folderCounts(accountIds: string[]) {
  const counts = await Promise.all(
    MAIL_FOLDERS.map((folder) =>
      CrmMailThreadModel.countDocuments({
        accountId: { $in: accountIds },
        unread: true,
        ...folderFilter(folder),
      }),
    ),
  );
  return MAIL_FOLDERS.map((folder, index) => ({ folder, unread: counts[index] }));
}
