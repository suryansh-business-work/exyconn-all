import type { StockMovementFieldsFragment } from '@exyconn/shell/graphql/generated';

export type StockMovementRow = StockMovementFieldsFragment;

export interface StockMovementFormValues {
  productId: string;
  reason: string;
  quantity: number;
  supplierId: string;
  reference: string;
  notes: string;
}
