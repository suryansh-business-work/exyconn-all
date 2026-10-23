import { createLimiter, enforceLimit } from '../../lib/rateLimiter';
import { isEmailAddress } from '../../utils/emailAddress';
import { badRequest } from '../../utils/errors';
import { htmlToText } from '../../utils/inboundMail';
import { logger } from '../../utils/logger';
import { sanitizeRichHtml } from '../../utils/sanitizeHtml';
import { withMailboxOutcome } from '../gmail/gmail.accounts';
import { gmailClient } from '../gmail/gmail.client';
import { sendThroughMicrosoft } from '../microsoft-mail/microsoft.send';
import { listMyMailboxes, sendingMailboxOf, type SendingMailbox } from './my-mailboxes.service';

/**
 * Sending from a person's own mailbox: the email window every portal opens on an address.
 * Nothing is kept on a CRM record — the provider's Sent folder is where it lives.
 */

export const MAX_RECIPIENTS = 50;
const MAX_SUBJECT_LENGTH = 200;
const MAX_BODY_LENGTH = 200_000;

/** Emails one person may send an hour, across every portal. */
const sendLimiter = createLimiter({ keyPrefix: 'my-email', points: 60, durationSec: 3600 });

export interface SendMyEmailInput {
  fromMailboxId?: string | null;
  to: string[];
  cc?: string[] | null;
  bcc?: string[] | null;
  subject: string;
  body: string;
  replyTo?: string | null;
}

/** What goes out, checked: addresses cleaned and de-duplicated, the body sanitized. */
export interface CheckedEmail {
  to: string[];
  cc: string[];
  bcc: string[];
  replyTo?: string;
  subject: string;
  body: string;
}

/**
 * The server's own address check (utils/emailAddress), the one the CRM sends with: the server
 * builds without the workspace packages, so @exyconn/regex's EMAIL is what the form checks first.
 */
const isAddress = isEmailAddress;

const cleaned = (list: string[] | null | undefined, taken: ReadonlySet<string>) => [
  ...new Set(
    (list ?? [])
      .map((address) => address.trim().toLowerCase())
      .filter((address) => address !== '' && !taken.has(address)),
  ),
];

/** The recipients, each address once (To before Cc before Bcc), all of them valid. */
function checkedRecipients(input: SendMyEmailInput) {
  const to = cleaned(input.to, new Set());
  const cc = cleaned(input.cc, new Set(to));
  const bcc = cleaned(input.bcc, new Set([...to, ...cc]));
  if (to.length === 0) {
    badRequest('Add at least one recipient.');
  }
  const everyone = [...to, ...cc, ...bcc];
  if (everyone.length > MAX_RECIPIENTS) {
    badRequest(`Send to at most ${MAX_RECIPIENTS} recipients at once.`);
  }
  const invalid = everyone.find((address) => !isAddress(address));
  if (invalid !== undefined) {
    badRequest(`${invalid} is not a valid email address.`);
  }
  return { to, cc, bcc };
}

function checkedReplyTo(value: string | null | undefined): string | undefined {
  const replyTo = value?.trim().toLowerCase() ?? '';
  if (replyTo === '') {
    return undefined;
  }
  if (!isAddress(replyTo)) {
    badRequest('The reply-to address is not a valid email address.');
  }
  return replyTo;
}

/** Validates an email before anything is sent; every refusal says what to fix. */
export function checkedEmail(input: SendMyEmailInput): CheckedEmail {
  const recipients = checkedRecipients(input);
  const replyTo = checkedReplyTo(input.replyTo);
  const subject = input.subject.trim();
  if (subject === '') {
    badRequest('Write a subject.');
  }
  if (subject.length > MAX_SUBJECT_LENGTH) {
    badRequest(`Keep the subject to ${MAX_SUBJECT_LENGTH} characters.`);
  }
  if (input.body.length > MAX_BODY_LENGTH) {
    badRequest('The message is too long to send.');
  }
  const body = sanitizeRichHtml(input.body);
  if (htmlToText(body).trim() === '') {
    badRequest('Write a message.');
  }
  return { ...recipients, replyTo, subject, body };
}

/** The caller's default mailbox that works now: the one they chose, else their newest. */
async function defaultMailboxId(ownerUserId: string): Promise<string> {
  const mine = await listMyMailboxes(ownerUserId);
  if (mine.length === 0) {
    badRequest('Connect your mailbox in Settings > Mailboxes first.');
  }
  const working = mine.filter((mailbox) => mailbox.status === 'CONNECTED');
  const chosen = working.find((mailbox) => mailbox.isDefault) ?? working[0];
  if (!chosen) {
    badRequest('Reconnect your mailbox in Settings > Mailboxes first.');
  }
  return chosen.id;
}

/** The mailbox it goes from: the one chosen (refused unless theirs), else their default. */
async function chosenMailbox(ownerUserId: string, fromMailboxId?: string | null) {
  let id = fromMailboxId ?? '';
  if (id === '') {
    id = await defaultMailboxId(ownerUserId);
  }
  const sending = await sendingMailboxOf(ownerUserId, id);
  if (sending.status !== 'CONNECTED') {
    badRequest(`Reconnect ${sending.mailbox.email} in Settings > Mailboxes first.`);
  }
  return sending;
}

function deliver(sending: SendingMailbox, email: CheckedEmail): Promise<unknown> {
  if (sending.provider === 'GMAIL') {
    const { mailbox } = sending;
    return withMailboxOutcome(mailbox.id, () =>
      gmailClient.send(mailbox, { ...email, from: mailbox.email, html: true }),
    );
  }
  return sendThroughMicrosoft(sending.mailbox, { ...email, contentType: 'HTML' });
}

/** Sends from one of the caller's own mailboxes; resolves to what went out (never the body). */
export async function sendMyEmail(ownerUserId: string, input: SendMyEmailInput) {
  const email = checkedEmail(input);
  const sending = await chosenMailbox(ownerUserId, input.fromMailboxId);
  await enforceLimit(sendLimiter, ownerUserId, 'emails');
  try {
    await deliver(sending, email);
  } catch (error) {
    // The provider's reason stays on the mailbox (lastError); the log says only which failed.
    logger.warn(
      { provider: sending.provider, mailboxId: sending.mailbox.id },
      'Personal email send failed',
    );
    throw error;
  }
  return {
    from: sending.mailbox.email,
    subject: email.subject,
    recipientCount: email.to.length + email.cc.length + email.bcc.length,
  };
}
