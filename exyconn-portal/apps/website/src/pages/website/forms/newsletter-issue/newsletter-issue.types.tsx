import { z } from 'zod';
import { SLUG } from '@exyconn/regex';
import type { NewsletterIssueFieldsFragment } from '@exyconn/shell/graphql/generated';

export type NewsletterIssueRow = NewsletterIssueFieldsFragment;

export const issueSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, 'Slug is required')
    .max(120, 'Keep the slug under 120 characters')
    .regex(SLUG, 'Use lower-case letters, digits and dashes'),
  title: z.string().trim().min(1, 'Title is required').max(200, 'Too long'),
  summary: z.string().trim().max(500, 'Keep the summary under 500 characters'),
  coverImage: z.string().trim().max(500, 'Too long'),
  content: z.string().trim().min(1, 'Write the issue'),
  isActive: z.boolean(),
  publishedAt: z.string().min(1, 'Pick the publish date'),
});

export type NewsletterIssueFormValues = z.infer<typeof issueSchema>;

export const toIssueValues = (row: NewsletterIssueRow | null): NewsletterIssueFormValues => ({
  slug: row?.slug ?? '',
  title: row?.title ?? '',
  summary: row?.summary ?? '',
  coverImage: row?.coverImage ?? '',
  content: row?.content ?? '',
  isActive: row?.isActive ?? true,
  publishedAt: row?.publishedAt ?? new Date().toISOString(),
});
