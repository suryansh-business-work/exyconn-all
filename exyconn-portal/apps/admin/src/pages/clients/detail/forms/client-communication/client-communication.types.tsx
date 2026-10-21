import { z } from 'zod';
import {
  ClientCommunicationType,
  type ListClientCommunicationsPagedQuery,
} from '@exyconn/shell/graphql/generated';

export type ClientCommunicationRow =
  ListClientCommunicationsPagedQuery['listClientCommunicationsPaged']['rows'][number];

/** The same caps the server checks (modules/clienthub/records/records.validation.ts). */
export const clientCommunicationSchema = z.object({
  type: z.enum(ClientCommunicationType),
  occurredAt: z.string().min(1, 'Pick when it happened'),
  subject: z
    .string()
    .trim()
    .min(1, 'Say what it was about')
    .max(200, 'Keep the subject under 200 characters'),
  summary: z.string().trim().max(2000, 'Keep the summary under 2000 characters'),
  details: z.string().trim().max(5000, 'Keep the details under 5000 characters'),
  participants: z.string().trim().max(500, 'Keep the list of people under 500 characters'),
  notify: z.boolean(),
});

export type ClientCommunicationFormValues = z.infer<typeof clientCommunicationSchema>;

export const clientCommunicationDefaults = (
  row: ClientCommunicationRow | null,
  now: Date,
): ClientCommunicationFormValues => ({
  type: row?.type ?? ClientCommunicationType.Call,
  occurredAt: row?.occurredAt ?? now.toISOString(),
  subject: row?.subject ?? '',
  summary: row?.summary ?? '',
  details: row?.details ?? '',
  participants: row?.participants ?? '',
  notify: false,
});
