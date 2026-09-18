import { z } from 'zod';
import { ItNetworkKind, ItServiceStatus } from '@exyconn/shell/graphql/generated';
import type { NetworkItemRow } from './network-item.types';

export const networkItemSchema = z.object({
  name: z.string().trim().min(2, 'Give it a name people will recognise').max(120, 'Too long'),
  kind: z.nativeEnum(ItNetworkKind),
  address: z.string().trim().max(200, 'Too long'),
  location: z.string().trim().max(120, 'Too long'),
  provider: z.string().trim().max(120, 'Too long'),
  status: z.nativeEnum(ItServiceStatus),
  notes: z.string().trim().max(2000, 'Keep notes under 2000 characters'),
});

export type NetworkItemValues = z.infer<typeof networkItemSchema>;

export function toNetworkItemValues(row: NetworkItemRow | null): NetworkItemValues {
  return {
    name: row?.name ?? '',
    kind: row?.kind ?? ItNetworkKind.Wifi,
    address: row?.address ?? '',
    location: row?.location ?? '',
    provider: row?.provider ?? '',
    status: row?.status ?? ItServiceStatus.Active,
    notes: row?.notes ?? '',
  };
}
