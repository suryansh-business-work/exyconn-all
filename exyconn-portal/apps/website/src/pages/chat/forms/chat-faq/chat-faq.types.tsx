import { z } from 'zod';
import type { WebsiteChatFaqFieldsFragment } from '@exyconn/shell/graphql/generated';

export type ChatFaqRow = WebsiteChatFaqFieldsFragment;

export const chatFaqSchema = z.object({
  question: z
    .string()
    .trim()
    .min(1, 'Question is required')
    .max(300, 'Keep the question under 300 characters'),
  answer: z
    .string()
    .trim()
    .min(1, 'Answer is required')
    .max(2000, 'Keep the answer under 2000 characters'),
  sortOrder: z.coerce
    .number({ message: 'Order must be a number' })
    .int('Order must be a whole number')
    .min(0, 'Order must be 0 or more'),
  isActive: z.boolean(),
});

export type ChatFaqFormInput = z.input<typeof chatFaqSchema>;
export type ChatFaqFormValues = z.output<typeof chatFaqSchema>;

export const toChatFaqValues = (row: ChatFaqRow | null): ChatFaqFormValues => ({
  question: row?.question ?? '',
  answer: row?.answer ?? '',
  sortOrder: row?.sortOrder ?? 0,
  isActive: row?.isActive ?? true,
});
