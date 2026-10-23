import { currentOrganizationId } from '../../lib/tenant';
import { badRequest, forbidden } from '../../utils/errors';
import { isEmailAddress } from '../../utils/emailAddress';
import { timelineTarget } from '../crm/timeline/crm.timeline';
import { gmailClient } from './gmail.client';
import {
  enabledMailboxes,
  noteAccountOutcome,
  sendingMailbox,
  type AccountMailbox,
} from './gmail.accounts';
import { CrmEmailMessageModel } from './gmail.models';
import { CrmMailThreadModel } from '../crm-mail/crm-mail.models';
import { keepRecord, toRecord } from './gmail.sync';

/**
 * The company whose CRM mailboxes a call works with. Every company connects and sends from
 * its own (the tenancy scope keeps each to its own rows); a caller acting in no company has
 * no CRM mailboxes at all. Returns that company.
 */
export function assertCompanyCrm(): string {
  const organizationId = currentOrganizationId();
  if (organizationId === null) {
    forbidden('Open a company’s CRM to use its email accounts.');
  }
  return organizationId;
}

export interface SendCrmEmailInput {
  /** The connected account it goes out from; it has to be enabled for the CRM. */
  fromAccountId: string;
  to: string[];
  cc?: string[] | null;
  subject: string;
  body: string;
  /** Replying in a thread: Gmail's thread id and the message being answered. */
  threadId?: string | null;
  inReplyTo?: string | null;
}

const cleanAddresses = (list: string[] | null | undefined) =>
  (list ?? []).map((address) => address.trim().toLowerCase()).filter(Boolean);

/**
 * How a reply joins its conversation. Gmail's thread id belongs to one mailbox, so it is only
 * passed on when replying from the account that holds the thread; In-Reply-To and References
 * (every Message-ID so far) thread it for everyone else's mail client either way.
 */
async function replyThreading(input: SendCrmEmailInput, mailbox: AccountMailbox) {
  if (!input.threadId) {
    return { threadId: undefined, inReplyTo: undefined, references: [] };
  }
  const [earlier, listed] = await Promise.all([
    CrmEmailMessageModel.find({ threadId: input.threadId })
      .sort({ sentAt: 1 })
      .select('accountId messageId')
      .lean(),
    // A conversation opened in CRM > Mail may be with nobody in the CRM yet.
    CrmMailThreadModel.findOne({ accountId: mailbox.id, threadId: input.threadId })
      .select('messageIds')
      .lean(),
  ]);
  const ids = [...(listed?.messageIds ?? []), ...earlier.map((message) => message.messageId)];
  const references = [...new Set(ids.filter(Boolean))];
  const sameMailbox =
    listed !== null || earlier.some((message) => message.accountId === mailbox.id);
  const answering = input.inReplyTo?.trim() ?? '';
  return {
    threadId: sameMailbox ? input.threadId : undefined,
    inReplyTo: answering === '' ? references.at(-1) : answering,
    references,
  };
}

/** The recipients and subject of an email the CRM sends, checked whichever mailbox sends it. */
export function checkedRecipients(input: SendCrmEmailInput) {
  const to = cleanAddresses(input.to);
  const cc = cleanAddresses(input.cc);
  if (to.length === 0 || [...to, ...cc].some((address) => !isEmailAddress(address))) {
    badRequest('Enter valid email addresses.');
  }
  if (input.subject.trim() === '' || input.body.trim() === '') {
    badRequest('Write a subject and a message.');
  }
  return { to, cc, subject: input.subject.trim() };
}

/** Sends from the chosen account and keeps the sent message, with its thread, on the record. */
export async function sendCrmEmail(input: SendCrmEmailInput, sentByName: string) {
  assertCompanyCrm();
  const { to, cc, subject } = checkedRecipients(input);
  const mailbox = await sendingMailbox(input.fromAccountId);
  const threading = await replyThreading(input, mailbox);
  try {
    const sent = await gmailClient.send(
      mailbox,
      {
        from: mailbox.email,
        to,
        cc,
        subject,
        body: input.body,
        inReplyTo: threading.inReplyTo,
        references: threading.references,
      },
      threading.threadId,
    );
    const record = toRecord(await gmailClient.message(mailbox, sent.id), mailbox);
    await keepRecord(record, sentByName);
    return { ...record, id: record.gmailId, sentByName };
  } catch (error) {
    await noteAccountOutcome(mailbox.id, error);
    throw error;
  }
}

/**
 * Which account a new email to the record goes from by default: the one that last wrote to
 * them, while it is still enabled; otherwise the newest connected one; null when there is none.
 * `mailboxIds` are the usable senders across providers (Gmail and Microsoft), in order of
 * preference; without them, the enabled Gmail accounts.
 */
export async function crmEmailSender(
  object: 'CONTACT' | 'COMPANY',
  id: string,
  mailboxIds?: string[],
) {
  const ids = mailboxIds ?? (await enabledMailboxes()).map((mailbox) => mailbox.id);
  if (ids.length === 0) {
    return null;
  }
  const { addresses } = await timelineTarget(object, id, 1);
  const last = await CrmEmailMessageModel.findOne({
    direction: 'OUT',
    participants: { $in: addresses },
    accountId: { $in: ids },
  })
    .sort({ sentAt: -1 })
    .select('accountId')
    .lean();
  return last?.accountId ?? ids[0];
}
