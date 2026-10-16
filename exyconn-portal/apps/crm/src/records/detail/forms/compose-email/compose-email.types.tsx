import { z } from 'zod';
import { EMAIL } from '@exyconn/regex';

const addressList = z.array(z.string().trim().regex(EMAIL, 'Each address must be a valid email'));

export const composeEmailSchema = z.object({
  to: addressList.min(1, 'Add at least one recipient'),
  cc: addressList,
  subject: z
    .string()
    .trim()
    .min(1, 'Write a subject')
    .max(300, 'Keep the subject under 300 characters'),
  body: z.string().trim().min(1, 'Write the message').max(50_000, 'The message is too long'),
  /** What the AI draft should say; not sent. */
  instruction: z.string().trim().max(1000, 'Keep the instruction under 1000 characters'),
});

export type ComposeEmailValues = z.infer<typeof composeEmailSchema>;

/** Who and what the email is about: the record, and the thread when it is a reply. */
export interface ComposeEmailContext {
  object: 'CONTACT' | 'COMPANY';
  id: string;
  to: string[];
  subject?: string;
  threadId?: string;
  inReplyTo?: string;
}

/** A reply keeps the subject with one "Re:" in front of it. */
export const replySubject = (subject: string) =>
  subject.toLowerCase().startsWith('re:') ? subject : `Re: ${subject}`;
