import { logger } from '../../utils/logger';
import { CompanyModel } from '../crm/company.model';
import { timelineTarget } from '../crm/timeline/crm.timeline';
import { gmailClient, type GmailMessage } from './gmail.client';
import { addressesIn, bodyTextOf, headerOf } from './gmail.mime';
import {
  enabledMailboxes,
  listGmailAccounts,
  noteAccountOutcome,
  type AccountMailbox,
} from './gmail.accounts';
import { CrmEmailMessageModel, type CrmEmailMessageDocument } from './gmail.models';

/** How many of a record's newest Gmail threads one sync reads, per account. */
const SYNC_THREADS = 20;
/** Addresses per Gmail search, so a company with many people stays under Google's limit. */
const TERMS_PER_QUERY = 15;
/** A company on one of these has no domain of its own: matching it would read everybody. */
const SHARED_MAIL_DOMAINS: ReadonlySet<string> = new Set([
  'gmail.com',
  'googlemail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'yahoo.com',
  'icloud.com',
  'aol.com',
  'proton.me',
  'protonmail.com',
]);

type Direction = 'IN' | 'OUT';
type Kind = 'CONTACT' | 'COMPANY';
type MailboxRef = Pick<AccountMailbox, 'id' | 'email'>;

/** One Gmail message as the CRM keeps it, read from (or sent by) one connected mailbox. */
export function toRecord(message: GmailMessage, mailbox: MailboxRef) {
  const from = addressesIn(headerOf(message.payload, 'From'))[0] ?? '';
  const to = addressesIn(headerOf(message.payload, 'To'));
  const cc = addressesIn(headerOf(message.payload, 'Cc'));
  const direction: Direction = from === mailbox.email ? 'OUT' : 'IN';
  return {
    gmailId: message.id,
    threadId: message.threadId,
    accountId: mailbox.id,
    mailbox: mailbox.email,
    messageId: headerOf(message.payload, 'Message-ID'),
    direction,
    from,
    to,
    cc,
    participants: [...new Set([from, ...to, ...cc])],
    subject: headerOf(message.payload, 'Subject'),
    snippet: message.snippet ?? '',
    bodyText: bodyTextOf(message.payload).slice(0, 50_000),
    sentAt: new Date(Number(message.internalDate ?? Date.now())),
  };
}

export type EmailRecord = ReturnType<typeof toRecord>;

/** Upserts by Gmail id; a sync never wipes the name of whoever sent it from the CRM. */
export const keepRecord = (record: EmailRecord, sentByName = '') =>
  CrmEmailMessageModel.updateOne(
    { gmailId: record.gmailId },
    { $set: { ...record, ...(sentByName ? { sentByName } : {}) } },
    { upsert: true },
  );

/** Who the record is in Gmail: its addresses, and a company's own domain. */
async function searchTermsOf(object: Kind, id: string) {
  const target = await timelineTarget(object, id, SYNC_THREADS);
  let domain = '';
  if (object === 'COMPANY') {
    const company = await CompanyModel.findById(id).select('domain').lean<{ domain?: string }>();
    const candidate = company?.domain?.trim().toLowerCase() ?? '';
    domain = candidate.includes('.') && !SHARED_MAIL_DOMAINS.has(candidate) ? candidate : '';
  }
  return { addresses: target.addresses, domain };
}

/** "from:a OR to:a OR cc:a OR …" in chunks small enough for one Gmail search each. */
export function gmailQueries(addresses: string[], domain: string): string[] {
  const terms = [...addresses, ...(domain ? [`@${domain}`] : [])];
  const queries: string[] = [];
  for (let start = 0; start < terms.length; start += TERMS_PER_QUERY) {
    queries.push(
      terms
        .slice(start, start + TERMS_PER_QUERY)
        .map((term) => `from:${term} OR to:${term} OR cc:${term}`)
        .join(' OR '),
    );
  }
  return queries;
}

/** Reads one mailbox's newest matching threads into the CRM; a failure stays with that account. */
async function syncAccount(mailbox: AccountMailbox, queries: string[]): Promise<void> {
  try {
    const found = await Promise.all(
      queries.map((query) => gmailClient.threadIds(mailbox, query, SYNC_THREADS)),
    );
    const ids = [...new Set(found.flat())].slice(0, SYNC_THREADS);
    const threads = await Promise.all(ids.map((id) => gmailClient.thread(mailbox, id)));
    await Promise.all(threads.flat().map((message) => keepRecord(toRecord(message, mailbox))));
    await noteAccountOutcome(mailbox.id, null);
  } catch (error) {
    logger.warn({ err: error, accountId: mailbox.id }, 'Gmail sync failed for one account');
    await noteAccountOutcome(mailbox.id, error);
  }
}

const escapeRegex = (value: string) => value.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);

/** The stored messages with the record, minus those of accounts switched off for the CRM. */
async function storedMessages(addresses: string[], domain: string) {
  const matches: object[] = [{ participants: { $in: addresses } }];
  if (domain) {
    matches.push({ participants: { $regex: `@${escapeRegex(domain)}$` } });
  }
  const disabled = (await listGmailAccounts())
    .filter((account) => !account.enabled)
    .map((account) => String(account._id));
  return CrmEmailMessageModel.find({ $or: matches, accountId: { $nin: disabled } })
    .sort({ sentAt: 1 })
    .lean<Array<CrmEmailMessageDocument & { _id: unknown }>>();
}

type StoredMessage = Awaited<ReturnType<typeof storedMessages>>[number];

/** Messages grouped into conversations: Gmail's thread id is per mailbox, so per account. */
export function groupThreads(messages: StoredMessage[]) {
  const threads = new Map<string, StoredMessage[]>();
  for (const message of messages) {
    const key = `${message.accountId ?? ''}:${message.threadId}`;
    threads.set(key, [...(threads.get(key) ?? []), message]);
  }
  return [...threads.values()]
    .map((list) => ({
      threadId: list[0].threadId,
      accountId: list[0].accountId ?? '',
      mailbox: list[0].mailbox ?? '',
      subject: list[0].subject ?? '',
      lastAt: list.at(-1)?.sentAt ?? new Date(0),
      messages: list.map((message) => ({ ...message, id: String(message._id) })),
    }))
    .sort((a, b) => b.lastAt.getTime() - a.lastAt.getTime());
}

/**
 * The record's email threads across every enabled account, newest first, after a fresh sync.
 * An account Gmail refuses is marked for reconnecting; the others' threads still arrive.
 */
export async function crmEmailThreads(object: Kind, id: string) {
  const mailboxes = await enabledMailboxes();
  const { addresses, domain } = await searchTermsOf(object, id);
  const queries = gmailQueries(addresses, domain);
  if (queries.length > 0) {
    await Promise.all(mailboxes.map((mailbox) => syncAccount(mailbox, queries)));
  }
  if (addresses.length === 0 && !domain) {
    return [];
  }
  return groupThreads(await storedMessages(addresses, domain));
}
