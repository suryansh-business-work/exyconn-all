import { badRequest, notFound } from '../../utils/errors';
import { openGmailSession } from '../gmail/gmail.client';
import type { AccountMailbox } from '../gmail/gmail.accounts';
import { mailFailure } from './crm-mail.errors';
import { attachmentData, threadFull } from './crm-mail.gmail';
import { recordLinks } from './crm-mail.links';
import { spendMailboxCall } from './crm-mail.mailboxes';
import { messageDetail } from './crm-mail.parse';
import { saveThread } from './crm-mail.store';

/** Opening one conversation of CRM > Mail, and downloading what is attached to it. */

/** The largest attachment the CRM hands over; bigger ones are opened in Gmail. */
export const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024;

/**
 * The conversation with every message, read from Gmail now (bodies are never stored). Its
 * list row is refreshed from the same answer, so the list agrees with what was just read.
 */
export async function mailThreadDetail(
  mailbox: AccountMailbox,
  threadId: string,
  own: ReadonlySet<string>,
) {
  let read;
  try {
    await spendMailboxCall(mailbox);
    read = await threadFull(await openGmailSession(mailbox), threadId);
  } catch (error) {
    mailFailure(error, mailbox.email, 'open a conversation');
  }
  const summary = await saveThread(mailbox, { threadId, ...read });
  if (!summary) {
    notFound('Conversation');
  }
  const [record] = await recordLinks([summary], own);
  return {
    ...summary,
    id: `${mailbox.id}:${threadId}`,
    threadId,
    record,
    messages: read.messages.map((message) => messageDetail(message, mailbox.email)),
  };
}

/** One attachment, base64-encoded for the browser to save; refused past the size limit. */
export async function mailAttachment(
  mailbox: AccountMailbox,
  messageId: string,
  attachmentId: string,
) {
  let answer;
  try {
    await spendMailboxCall(mailbox);
    answer = await attachmentData(await openGmailSession(mailbox), messageId, attachmentId);
  } catch (error) {
    mailFailure(error, mailbox.email, 'download an attachment');
  }
  const bytes = Buffer.from(answer.data ?? '', 'base64url');
  if (bytes.length > MAX_ATTACHMENT_BYTES) {
    badRequest('This attachment is larger than 15 MB. Open it in Gmail to download it.');
  }
  return { data: bytes.toString('base64'), size: bytes.length };
}
