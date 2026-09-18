import type { ItPurchaseRequestFieldsFragment } from '@exyconn/shell/graphql/generated';

/** One purchase request, as the generated fragment types it. */
export type PurchaseRequestRow = ItPurchaseRequestFieldsFragment;

/** One vendor quote as the form edits it. */
export interface QuoteValues {
  vendor: string;
  amount: number;
  notes: string;
}
