import { z } from 'zod';
import { EMAIL } from '@exyconn/regex';

/** Visible text of a rich-text value, so an editor holding only empty tags counts as empty. */
const textOf = (html: string) => html.replaceAll(/<[^>]*>/g, '').trim();

/** A list of addresses typed as chips: every one must be an email, and at most 20. */
const addressList = z
  .array(z.string().trim())
  .max(20, 'Copy at most 20 people')
  .refine((list) => list.every((address) => EMAIL.test(address)), {
    message: 'Every address must be a valid email',
  });

export const customMailSchema = z.object({
  cc: addressList,
  bcc: addressList,
  subject: z
    .string()
    .trim()
    .min(1, 'Subject is required')
    .min(3, 'Minimum 3 characters')
    .max(200, 'Keep the subject under 200 characters'),
  message: z
    .string()
    .refine((html) => textOf(html).length > 0, { message: 'Message is required' })
    .refine((html) => textOf(html).length >= 10, { message: 'Minimum 10 characters' }),
  attachments: z
    .array(z.object({ url: z.string(), name: z.string(), contentType: z.string() }))
    .max(10, 'Attach at most 10 files'),
});
export type CustomMailValues = z.infer<typeof customMailSchema>;

export const EMPTY_MAIL: CustomMailValues = {
  cc: [],
  bcc: [],
  subject: '',
  message: '',
  attachments: [],
};
