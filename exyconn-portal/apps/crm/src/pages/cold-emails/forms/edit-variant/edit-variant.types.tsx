import { z } from 'zod';

export const MAX_SUBJECT_CHARS = 200;
export const MAX_BODY_CHARS = 5000;

export const editVariantSchema = z.object({
  subject: z
    .string()
    .trim()
    .min(1, 'Write a subject')
    .max(MAX_SUBJECT_CHARS, `Keep the subject under ${MAX_SUBJECT_CHARS} characters`),
  body: z
    .string()
    .trim()
    .min(1, 'Write the message')
    .max(MAX_BODY_CHARS, `Keep the message under ${MAX_BODY_CHARS} characters`),
});

export type EditVariantValues = z.infer<typeof editVariantSchema>;
