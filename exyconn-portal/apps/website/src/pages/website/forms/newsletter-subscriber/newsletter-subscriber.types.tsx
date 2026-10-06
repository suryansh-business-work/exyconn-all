import { z } from 'zod';
import { EMAIL } from '@exyconn/regex';
import type { NewsletterSubscriberFieldsFragment } from '@exyconn/shell/graphql/generated';

export type NewsletterSubscriberRow = NewsletterSubscriberFieldsFragment;

export const subscriberSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .max(254, 'Too long')
    .regex(EMAIL, 'Enter a valid email'),
  name: z.string().trim().max(120, 'Keep the name under 120 characters'),
});

export type NewsletterSubscriberFormValues = z.infer<typeof subscriberSchema>;
