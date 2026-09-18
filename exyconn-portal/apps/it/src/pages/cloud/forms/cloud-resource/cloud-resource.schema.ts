import { z } from 'zod';
import { ItCloudKind, ItEnvironment, ItServiceStatus } from '@exyconn/shell/graphql/generated';
import type { CloudResourceRow } from './cloud-resource.types';

/** Kinds that lapse on a date, so leaving the date empty is worth a warning in the UI. */
export const EXPIRING_KINDS: ReadonlySet<ItCloudKind> = new Set([
  ItCloudKind.Domain,
  ItCloudKind.SslCertificate,
]);

export const cloudResourceSchema = z
  .object({
    name: z.string().trim().min(2, 'Give it a name people will recognise').max(120, 'Too long'),
    kind: z.nativeEnum(ItCloudKind),
    provider: z.string().trim().max(120, 'Too long'),
    environment: z.nativeEnum(ItEnvironment),
    region: z.string().trim().max(60, 'Too long'),
    endpoint: z.string().trim().max(300, 'Too long'),
    /** ISO string from the picker; empty means it does not expire. */
    expiresAt: z.string(),
    monthlyCost: z.coerce
      .number({ message: 'Cost must be a number' })
      .min(0, 'Cost cannot be negative'),
    status: z.nativeEnum(ItServiceStatus),
    ownerName: z.string().trim().max(120, 'Too long'),
    notes: z.string().trim().max(2000, 'Keep notes under 2000 characters'),
  })
  .refine((v) => !EXPIRING_KINDS.has(v.kind) || v.expiresAt !== '', {
    message: 'A domain or certificate needs its expiry date',
    path: ['expiresAt'],
  });

export type CloudResourceValues = z.infer<typeof cloudResourceSchema>;

/** An empty date means "does not expire", which the API spells null. */
export function toCloudResourceInput(values: CloudResourceValues) {
  return { ...values, expiresAt: values.expiresAt || null };
}

export function toCloudResourceValues(row: CloudResourceRow | null): CloudResourceValues {
  return {
    name: row?.name ?? '',
    kind: row?.kind ?? ItCloudKind.Server,
    provider: row?.provider ?? '',
    environment: row?.environment ?? ItEnvironment.Production,
    region: row?.region ?? '',
    endpoint: row?.endpoint ?? '',
    expiresAt: row?.expiresAt ?? '',
    monthlyCost: row?.monthlyCost ?? 0,
    status: row?.status ?? ItServiceStatus.Active,
    ownerName: row?.ownerName ?? '',
    notes: row?.notes ?? '',
  };
}
