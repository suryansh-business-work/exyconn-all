import { currentOrganizationId } from '../../lib/tenant';
import { platformOperatorOrganizationId } from '../../lib/platformAccess';
import { badRequest, forbidden } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { isEmailAddress } from '../../utils/emailAddress';
import { timelineTarget } from '../crm/timeline/crm.timeline';
import { connectedConfig, gmailClient, type GmailMessage } from './gmail.client';
import { addressesIn, headerOf, plainTextOf } from './gmail.mime';
import { CrmEmailMessageModel, type GmailConfigDocument } from './gmail.models';

/** How many of a record's newest Gmail threads one sync reads. */
const SYNC_THREADS = 20;

/**
 * The CRM's Gmail: the operator's own mailbox, so only the operator's own CRM may read or send
 * through it — a customer company never sees Exyconn's mail.
 */
export async function assertOperatorCrm(): Promise<void> {
  const operator = await platformOperatorOrganizationId();
  if (!operator || currentOrganizationId() !== operator) {
    forbidden('Gmail is connected for Exyconn’s own CRM only.');
  }
}

type Direction = 'IN' | 'OUT';

/** One Gmail message as the CRM keeps it. */
function toRecord(message: GmailMessage, mailbox: string, sentByName = '') {
  const from = addressesIn(headerOf(message.payload, 'From'))[0] ?? '';
  const to = addressesIn(headerOf(message.payload, 'To'));
  const cc = addressesIn(headerOf(message.payload, 'Cc'));
  const direction: Direction = from === mailbox ? 'OUT' : 'IN';
  return {
    gmailId: message.id,
    threadId: message.threadId,
    messageId: headerOf(message.payload, 'Message-ID'),
    direction,
    from,
    to,
    cc,
    participants: [...new Set([from, ...to, ...cc])],
    subject: headerOf(message.payload, 'Subject'),
    snippet: message.snippet ?? '',
    bodyText: plainTextOf(message.payload).slice(0, 50_000),
    sentAt: new Date(Number(message.internalDate ?? Date.now())),
    sentByName,
  };
}

const keep = (record: ReturnType<typeof toRecord>) =>
  CrmEmailMessageModel.updateOne({ gmailId: record.gmailId }, { $set: record }, { upsert: true });

/** Reads the record's newest threads from Gmail into the CRM; the old ones stay as they were. */
async function sync(config: GmailConfigDocument, addresses: string[]): Promise<void> {
  if (addresses.length === 0) {
    return;
  }
  const query = addresses
    .map((address) => `from:${address} OR to:${address} OR cc:${address}`)
    .join(' OR ');
  const ids = await gmailClient.threadIds(config, query, SYNC_THREADS);
  const threads = await Promise.all(ids.map((id) => gmailClient.thread(config, id)));
  await Promise.all(
    threads.flat().map((message) => keep(toRecord(message, config.connectedEmail))),
  );
}

/** The record's email threads, newest first, after a fresh sync (or as last synced, if Gmail fails). */
export async function crmEmailThreads(object: 'CONTACT' | 'COMPANY', id: string) {
  await assertOperatorCrm();
  const config = await connectedConfig();
  const target = await timelineTarget(object, id, SYNC_THREADS);
  try {
    await sync(config, target.addresses);
  } catch (error) {
    logger.warn({ err: error }, 'Gmail sync failed; showing what was synced before');
  }
  const messages = await CrmEmailMessageModel.find({ participants: { $in: target.addresses } })
    .sort({ sentAt: 1 })
    .lean();
  const threads = new Map<string, typeof messages>();
  for (const message of messages) {
    threads.set(message.threadId, [...(threads.get(message.threadId) ?? []), message]);
  }
  return [...threads.entries()]
    .map(([threadId, list]) => ({
      threadId,
      subject: list[0]?.subject ?? '',
      lastAt: list.at(-1)?.sentAt ?? new Date(0),
      messages: list.map((message) => ({ ...message, id: String(message._id) })),
    }))
    .sort((a, b) => b.lastAt.getTime() - a.lastAt.getTime());
}

export interface SendCrmEmailInput {
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

/** Sends as the connected mailbox and keeps the sent message on the CRM record. */
export async function sendCrmEmail(input: SendCrmEmailInput, sentByName: string) {
  await assertOperatorCrm();
  const to = cleanAddresses(input.to);
  const cc = cleanAddresses(input.cc);
  if (to.length === 0 || [...to, ...cc].some((address) => !isEmailAddress(address))) {
    badRequest('Enter valid email addresses.');
  }
  if (input.subject.trim() === '' || input.body.trim() === '') {
    badRequest('Write a subject and a message.');
  }
  const config = await connectedConfig();
  const sent = await gmailClient.send(
    config,
    {
      from: config.connectedEmail,
      to,
      cc,
      subject: input.subject.trim(),
      body: input.body,
      inReplyTo: input.inReplyTo ?? undefined,
    },
    input.threadId ?? undefined,
  );
  const full = await gmailClient.message(config, sent.id);
  const record = toRecord(full, config.connectedEmail, sentByName);
  await keep(record);
  return { ...record, id: record.gmailId };
}
