import { z } from 'zod';
import { StatusCategory } from '@exyconn/shell/graphql/generated';
import type { StatusMonitorRow } from './status-monitor.types';

export const statusMonitorSchema = z.object({
  key: z
    .string()
    .trim()
    .min(2, 'Key is required')
    .max(40, 'Keep the key under 40 characters')
    .regex(/^[a-z0-9-]+$/, 'Use lower-case letters, digits and hyphens only'),
  name: z.string().trim().min(2, 'Name is required').max(80, 'Keep the name under 80 characters'),
  description: z.string().trim().max(160, 'Keep the description under 160 characters'),
  category: z.nativeEnum(StatusCategory),
  url: z
    .string()
    .trim()
    .min(1, 'URL is required')
    .refine((url) => url.startsWith('https://') || url.startsWith('http://'), {
      message: 'Enter the full URL, starting with https://',
    }),
  isActive: z.boolean(),
  order: z.coerce.number({ message: 'Order must be a number' }).min(0, 'Order cannot be negative'),
});

type Values = z.infer<typeof statusMonitorSchema>;

export function toStatusMonitorValues(row: StatusMonitorRow | null): Values {
  return {
    key: row?.key ?? '',
    name: row?.name ?? '',
    description: row?.description ?? '',
    category: row?.category ?? StatusCategory.Portal,
    url: row?.url ?? '',
    isActive: row?.isActive ?? true,
    order: row?.order ?? 0,
  };
}
