import type { ListTaxSlabsPagedQuery } from '@exyconn/shell/graphql/generated';

/** One band of a regime's table, exactly as the paged query returns it. */
export type TaxSlabRow = ListTaxSlabsPagedQuery['listTaxSlabsPaged']['rows'][number];

/** Form values for one band. `toAmount` is null for the open-ended top band. */
export interface TaxSlabFormValues {
  regimeKey: string;
  financialYear: string;
  fromAmount: number;
  toAmount: number | null;
  ratePercent: number;
  order: number;
  active: boolean;
}
