import { z } from 'zod';
import { EMAIL } from '@exyconn/regex';
import type { MyMailboxFieldsFragment } from '@/graphql/generated';

/** The most people one email may go to, across To, Cc and Bcc (the server holds the same line). */
export const MAX_RECIPIENTS = 50;

const addressList = z
  .array(z.string().trim().regex(EMAIL, 'Each address must be a valid email'))
  .max(MAX_RECIPIENTS, 'Send to at most 50 people at once');

export const sendEmailSchema = z.object({
  /** One of the person's own connected mailboxes. */
  fromMailboxId: z.string().trim().min(1, 'Choose the mailbox to send from'),
  to: addressList.min(1, 'Add at least one recipient'),
  cc: addressList,
  bcc: addressList,
  subject: z
    .string()
    .trim()
    .min(1, 'Write a subject')
    .max(200, 'Keep the subject under 200 characters'),
  body: z.string().trim().min(1, 'Write the message').max(200_000, 'The message is too long'),
});

export type SendEmailValues = z.infer<typeof sendEmailSchema>;

/** What a page hands the email window: who it is to, and anything already written. */
export interface EmailDraft {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject?: string;
  /** HTML the message starts from. */
  body?: string;
}

/** One of the person's own mailboxes, as the From select lists it. */
export type MyMailbox = MyMailboxFieldsFragment;
