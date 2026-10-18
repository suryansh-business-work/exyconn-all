import { randomUUID } from 'node:crypto';
import { badRequest } from '../../utils/errors';
import { assertOperatorCrm, checkedRecipients, type SendCrmEmailInput } from '../gmail/gmail.crm';
import { keepRecord, type EmailRecord } from '../gmail/gmail.sync';
import { graph, refreshMailbox, type MicrosoftMailbox } from './microsoft.client';
import { enabledMicrosoftMailboxes, noteMicrosoftOutcome } from './microsoft.accounts';

const recipients = (addresses: string[]) =>
  addresses.map((address) => ({ emailAddress: { address } }));

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
  await assertOperatorCrm();
  const { to, cc, subject } = checkedRecipients(input);
  const mailbox = await sendingMicrosoftMailbox(input.fromAccountId);
  try {
    const tokens = await refreshMailbox(mailbox);
    await graph(tokens.access_token ?? '', '/me/sendMail', {
      method: 'POST',
      body: JSON.stringify({
        message: {
          subject,
          body: { contentType: 'Text', content: input.body },
          toRecipients: recipients(to),
          ccRecipients: recipients(cc),
        },
        saveToSentItems: true,
      }),
    });
    await noteMicrosoftOutcome(mailbox.id, { refreshToken: tokens.refresh_token });
  } catch (error) {
    await noteMicrosoftOutcome(mailbox.id, { error });
    throw error;
  }
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
