import type { AssetFieldsFragment } from '@exyconn/shell/graphql/generated';

export type AssetRow = AssetFieldsFragment;

export interface AssetFormValues {
  assetTag: string;
  name: string;
  category: string;
  status: string;
  manufacturer: string;
  modelName: string;
  serialNumber: string;
  assignedToId: string;
  location: string;
  purchaseDate: Date | null;
  warrantyExpiry: Date | null;
  purchaseCost: number;
  notes: string;
}
