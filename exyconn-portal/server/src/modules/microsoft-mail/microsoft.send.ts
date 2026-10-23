import { randomUUID } from 'node:crypto';
import { badRequest } from '../../utils/errors';
import { assertCompanyCrm, checkedRecipients, type SendCrmEmailInput } from '../gmail/gmail.crm';
import { keepRecord, type EmailRecord } from '../gmail/gmail.sync';
import { graph, refreshMailbox, type MicrosoftMailbox } from './microsoft.client';
import { enabledMicrosoftMailboxes, noteMicrosoftOutcome } from './microsoft.accounts';

const recipients = (addresses: string[]) =>
  addresses.map((address) => ({ emailAddress: { address } }));

/** One email for Graph's sendMail; Bcc and Reply-To are left out when there are none. */
export interface MicrosoftOutgoing {
  to: string[];
  cc: string[];
  bcc?: string[];
  replyTo?: string;
  subject: string;
  body: string;
  contentType: 'Text' | 'HTML';
}

/**
 * Sends through Graph's sendMail as the mailbox and keeps the outcome on it (a rotated token
 * on success, the reason on failure). The CRM's sends and a person's own both go through this.
 */
export async function sendThroughMicrosoft(
  mailbox: MicrosoftMailbox,
  email: MicrosoftOutgoing,
): Promise<void> {
  const bcc = email.bcc ?? [];
  try {
    const tokens = await refreshMailbox(mailbox);
    await graph(tokens.access_token, '/me/sendMail', {
      method: 'POST',
      body: JSON.stringify({
        message: {
          subject: email.subject,
          body: { contentType: email.contentType, content: email.body },
          toRecipients: recipients(email.to),
          ccRecipients: recipients(email.cc),
          ...(bcc.length > 0 ? { bccRecipients: recipients(bcc) } : {}),
          ...(email.replyTo ? { replyTo: recipients([email.replyTo]) } : {}),
        },
        saveToSentItems: true,
      }),
    });
    await noteMicrosoftOutcome(mailbox.id, { refreshToken: tokens.refresh_token });
  } catch (error) {
    await noteMicrosoftOutcome(mailbox.id, { error });
    throw error;
  }
}

/** The mailbox an email goes out from: it has to be one the CRM may use right now. */
async function sendingMicrosoftMailbox(accountId: string): Promise<MicrosoftMailbox> {
  const mailbox = (await enabledMicrosoftMailboxes()).find((each) => each.id === accountId);
  if (!mailbox) {
    badRequest('Choose a connected Microsoft mailbox that is turned on for the CRM.');
  }
  return mailbox;
}

/**
 * Sends from a connected Microsoft mailbox through Graph's sendMail, and keeps the message on
 * the record as a CrmEmailMessage so the timeline and the Emails tab show it.
 *
 * Out of scope: reading Microsoft threads back (there is no Microsoft sync, so replies arrive
 * only in Outlook), and threading — sendMail returns no message id and cannot set In-Reply-To,
 * so every Microsoft send is its own conversation in the CRM.
 */
export async function sendMicrosoftCrmEmail(input: SendCrmEmailInput, sentByName: string) {
  assertCompanyCrm();
  const { to, cc, subject } = checkedRecipients(input);
  const mailbox = await sendingMicrosoftMailbox(input.fromAccountId);
  await sendThroughMicrosoft(mailbox, {
    to,
    cc,
    subject,
    body: input.body,
    contentType: 'Text',
  });
  const localId = `microsoft:${randomUUID()}`;
  const record: EmailRecord = {
    gmailId: localId,
    threadId: localId,
    accountId: mailbox.id,
    mailbox: mailbox.email,
    messageId: '',
    direction: 'OUT',
    from: mailbox.email,
    to,
    cc,
    participants: [...new Set([mailbox.email, ...to, ...cc])],
    subject,
    snippet: input.body.slice(0, 200),
    bodyText: input.body.slice(0, 50_000),
    sentAt: new Date(),
  };
  await keepRecord(record, sentByName);
  return { ...record, id: record.gmailId, sentByName };
}
