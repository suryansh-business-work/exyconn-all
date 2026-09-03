import { z } from 'zod';
import { AssetCategory, AssetStatus } from '@exyconn/shell/graphql/generated';
import { isAssignedStatus } from '../../assets.constants';
import type { AssetRow } from './asset.types';

export const assetSchema = z
  .object({
    assetTag: z.string().trim().min(1, 'Asset tag is required').max(40, 'Asset tag is too long'),
    name: z.string().trim().min(1, 'Name is required'),
    category: z.nativeEnum(AssetCategory),
    status: z.nativeEnum(AssetStatus),
    manufacturer: z.string().trim(),
    modelName: z.string().trim(),
    serialNumber: z.string().trim(),
    assignedToId: z.string().trim(),
    location: z.string().trim(),
    purchaseDate: z.date().nullable(),
    warrantyExpiry: z.date().nullable(),
    purchaseCost: z.coerce
      .number({ message: 'Cost must be a number' })
      .min(0, 'Cost cannot be negative'),
    notes: z.string().trim(),
  })
  // An assigned asset without a holder is a row nobody can act on, so it is rejected
  // here rather than saved and chased later.
  .refine((v) => !isAssignedStatus(v.status) || v.assignedToId.length > 0, {
    message: 'Choose who the asset is assigned to',
    path: ['assignedToId'],
  });

type Values = z.infer<typeof assetSchema>;

/** The DateTime scalar travels as an ISO string, so the pickers' Dates are converted. */
const asIso = (value: Date | null) => value?.toISOString() ?? null;

/** Maps the validated form values onto the GraphQL input. */
export function toAssetInput(values: Values, nameFor: (id: string) => string) {
  const assigned = isAssignedStatus(values.status);
  return {
    ...values,
    purchaseDate: asIso(values.purchaseDate),
    warrantyExpiry: asIso(values.warrantyExpiry),
    assignedToId: assigned ? values.assignedToId : '',
    assignedToName: assigned ? nameFor(values.assignedToId) : '',
  };
}

const asDate = (value?: string | null) => (value ? new Date(value) : null);

export function toAssetValues(row: AssetRow | null): Values {
  return {
    assetTag: row?.assetTag ?? '',
    name: row?.name ?? '',
    category: row?.category ?? AssetCategory.Laptop,
    status: row?.status ?? AssetStatus.InStock,
    manufacturer: row?.manufacturer ?? '',
    modelName: row?.modelName ?? '',
    serialNumber: row?.serialNumber ?? '',
    assignedToId: row?.assignedToId ?? '',
    location: row?.location ?? '',
    purchaseDate: asDate(row?.purchaseDate),
    warrantyExpiry: asDate(row?.warrantyExpiry),
    purchaseCost: row?.purchaseCost ?? 0,
    notes: row?.notes ?? '',
  };
}
