import { z } from 'zod';
import { IPV4 } from '@exyconn/regex';
import type { CmsDomainDnsFieldsFragment } from '@exyconn/shell/graphql/generated';

export type CmsDomainDnsRow = CmsDomainDnsFieldsFragment;

/** The TTLs the DNS providers accept for a record set through the portal. */
export const MIN_TTL = 600;
export const MAX_TTL = 86_400;

export const aRecordSchema = z.object({
  ip: z
    .string()
    .trim()
    .min(1, 'Enter the IPv4 address')
    .regex(IPV4, 'Enter an IPv4 address, like 203.0.113.10'),
  ttl: z.coerce
    .number({ message: 'TTL must be a number' })
    .int('Use whole seconds')
    .min(MIN_TTL, 'At least 600 seconds')
    .max(MAX_TTL, 'At most 86400 seconds (a day)'),
});

export type ARecordFormInput = z.input<typeof aRecordSchema>;
export type ARecordFormValues = z.infer<typeof aRecordSchema>;
