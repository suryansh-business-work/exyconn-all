import { z } from 'zod';
import { HTTP_URL } from '@exyconn/regex';
import type { ClientLinksQuery } from '@exyconn/shell/graphql/generated';

export type ClientLinkRow = ClientLinksQuery['clientLinks'][number];

/** The same caps the server checks (modules/clienthub/records/records.validation.ts). */
export const clientLinkSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Give the link a title')
    .max(200, 'Keep the title under 200 characters'),
  url: z
    .string()
    .trim()
    .min(1, 'Enter the address')
    .max(2000, 'Keep the address under 2000 characters')
    .regex(HTTP_URL, 'Enter a full address starting with http:// or https://'),
  description: z.string().trim().max(500, 'Keep the description under 500 characters'),
  details: z.string().trim().max(5000, 'Keep the details under 5000 characters'),
  notify: z.boolean(),
});

export type ClientLinkFormValues = z.infer<typeof clientLinkSchema>;

export const clientLinkDefaults = (row: ClientLinkRow | null): ClientLinkFormValues => ({
  title: row?.title ?? '',
  url: row?.url ?? '',
  description: row?.description ?? '',
  details: row?.details ?? '',
  notify: false,
});
