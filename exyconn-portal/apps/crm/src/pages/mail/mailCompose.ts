import {
  CrmEmailDirection,
  CrmTimelineObject,
  type CrmMailThreadQuery,
} from '@exyconn/shell/graphql/generated';
import { replySubject, type ComposeEmailContext } from '../../records/detail/forms/compose-email';

export type MailThread = CrmMailThreadQuery['crmMailThread'];
export type MailMessage = MailThread['messages'][number];
export type ReplyMode = 'reply' | 'replyAll' | 'forward';

/** The sentences a quoted message is introduced with, already translated by the caller. */
export interface QuoteWords {
  /** e.g. "On 5 Oct 2026, 09:00, Asha <asha@acme.io> wrote:" */
  wrote: string;
  /** The forwarded block's header, e.g. "---------- Forwarded message ----------". */
  forwarded: string;
}

/** The record a reply files under: the conversation's contact or company, if it has one. */
function recordOf(thread: MailThread): Pick<ComposeEmailContext, 'object' | 'id'> {
  if (thread.record?.object === CrmTimelineObject.Company) {
    return { object: 'COMPANY', id: thread.record.id };
  }
  return { object: 'CONTACT', id: thread.record?.id ?? '' };
}

/** "Asha <asha@acme.io>", or the bare address when there is no name. */
export const senderOf = (message: MailMessage) =>
  message.fromName ? `${message.fromName} <${message.fromAddress}>` : message.fromAddress;

const quoted = (text: string) =>
  text
    .split('\n')
    .map((line) => `> ${line}`)
    .join('\n');

/** Who a reply goes to: the sender of the newest message from the other side, or everyone. */
function recipients(thread: MailThread, all: boolean): string[] {
  const own = thread.mailbox;
  const last = thread.messages.findLast((m) => m.direction === CrmEmailDirection.In);
  const answering = last ?? thread.messages.at(-1);
  if (!answering) {
    return [];
  }
  const sender =
    answering.direction === CrmEmailDirection.In ? [answering.fromAddress] : answering.to;
  const list = all ? [...sender, ...answering.to, ...answering.cc] : sender;
  return [...new Set(list)].filter((address) => address !== own);
}

/**
 * What the compose form starts with for a reply, a reply to all or a forward of `message`:
 * recipients, subject, the quoted text, and the thread and mailbox a reply stays in.
 * Reply all puts everyone in To: the shared compose form has no way to start with Cc filled.
 */
export function composeFor(
  thread: MailThread,
  message: MailMessage,
  mode: ReplyMode,
  words: QuoteWords,
): ComposeEmailContext {
  const base = { ...recordOf(thread), fromAccountId: thread.accountId };
  if (mode === 'forward') {
    const subject = /^fwd?:/i.test(thread.subject) ? thread.subject : `Fwd: ${thread.subject}`;
    return {
      ...base,
      to: [],
      subject,
      body: `\n\n${words.forwarded}\n${message.text}`,
    };
  }
  return {
    ...base,
    to: recipients(thread, mode === 'replyAll'),
    subject: replySubject(thread.subject),
    body: `\n\n${words.wrote}\n${quoted(message.text)}`,
    threadId: thread.threadId,
    inReplyTo: message.messageId || undefined,
  };
}
