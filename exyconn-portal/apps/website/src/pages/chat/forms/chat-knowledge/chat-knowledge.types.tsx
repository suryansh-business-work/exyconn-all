import { z } from 'zod';
import { HTTP_URL } from '@exyconn/regex';
import type { WebsiteChatKnowledgeFieldsFragment } from '@exyconn/shell/graphql/generated';

export type ChatKnowledgeRow = WebsiteChatKnowledgeFieldsFragment;

/** Limits match the server's knowledge model (title 300, url 500, content 20000). */
export const chatKnowledgeSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(300, 'Keep the title under 300 characters'),
  url: z
    .string()
    .trim()
    .max(500, 'Keep the link under 500 characters')
    .regex(HTTP_URL, 'Enter a full link starting with https://')
    .or(z.literal('')),
  content: z
    .string()
    .trim()
    .min(1, 'Content is required')
    .max(20000, 'Keep the content under 20000 characters'),
  isActive: z.boolean(),
});

export type ChatKnowledgeFormValues = z.infer<typeof chatKnowledgeSchema>;

export const toChatKnowledgeValues = (row: ChatKnowledgeRow | null): ChatKnowledgeFormValues => ({
  title: row?.title ?? '',
  url: row?.url ?? '',
  content: row?.content ?? '',
  isActive: row?.isActive ?? true,
});
