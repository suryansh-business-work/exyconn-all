import { z } from 'zod';
import { EMAIL } from '@exyconn/regex';
import { visibleText } from '@exyconn/shell/utils/visibleText';

const addressList = z.array(z.string().trim().regex(EMAIL, 'Each address must be a valid email'));

export const composeEmailSchema = z.object({
  /** The connected Gmail or Microsoft mailbox it goes out from. */
  fromAccountId: z.string().trim().min(1, 'Choose the mailbox to send from'),
  to: addressList.min(1, 'Add at least one recipient'),
  cc: addressList,
  subject: z
    .string()
    .trim()
    .min(1, 'Write a subject')
    .max(300, 'Keep the subject under 300 characters'),
  /** Rich text (HTML) from the editor; plain text for a cold email version. */
  body: z
    .string()
    .trim()
    .max(50_000, 'The message is too long')
    .refine((body) => visibleText(body) !== '', 'Write the message'),
  /** What the AI draft should say; not sent. */
  instruction: z.string().trim().max(1000, 'Keep the instruction under 1000 characters'),
});

export type ComposeEmailValues = z.infer<typeof composeEmailSchema>;

/**
 * Who and what the email is about: the record, and the thread when it is a reply. An empty
 * `id` is an email about no record yet (e.g. a new email in CRM > Mail).
 */
export interface ComposeEmailContext {
  object: 'CONTACT' | 'COMPANY';
  id: string;
  to: string[];
  /** Others copied, e.g. everyone else on the message for Reply all. */
  cc?: string[];
  subject?: string;
  /** A message to start from, e.g. a cold email version. */
  body?: string;
  /** The earlier mail a reply or forward carries, as plain text; sent quoted under the body. */
  quote?: string;
  /** The recipient is fixed (a cold email goes to the draft's address): To is shown, not edited. */
  recipientsLocked?: boolean;
  threadId?: string;
  inReplyTo?: string;
  /** The Gmail account a reply starts on: the one holding the thread. */
  fromAccountId?: string;
}

/** A reply keeps the subject with one "Re:" in front of it. */
export const replySubject = (subject: string) =>
  subject.toLowerCase().startsWith('re:') ? subject : `Re: ${subject}`;
