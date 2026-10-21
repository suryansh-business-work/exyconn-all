import { z } from 'zod';

/** The same caps the server checks (modules/clienthub/records/client-email.service.ts). */
export const emailClientSchema = z.object({
  to: z.array(z.string()).min(1, 'Pick at least one person'),
  subject: z
    .string()
    .trim()
    .min(1, 'Write a subject')
    .max(200, 'Keep the subject under 200 characters'),
  message: z
    .string()
    .trim()
    .min(1, 'Write a message')
    .max(10_000, 'Keep the message under 10,000 characters'),
});

export type EmailClientFormValues = z.infer<typeof emailClientSchema>;

export const emailClientDefaults: EmailClientFormValues = { to: [], subject: '', message: '' };
