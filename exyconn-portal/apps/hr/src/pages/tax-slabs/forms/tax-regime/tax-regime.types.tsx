import type { ListTaxRegimesQuery } from '@exyconn/shell/graphql/generated';

/** One income-tax regime, exactly as the list query returns it. */
export type TaxRegimeRow = ListTaxRegimesQuery['listTaxRegimes'][number];

/** Form values for a regime's own figures — the ones that sit beside its bands. */
export interface TaxRegimeFormValues {
  regimeKey: string;
  financialYear: string;
  name: string;
  standardDeduction: number;
  rebateIncomeLimit: number;
  rebateMaxTax: number;
  cessPercent: number;
  active: boolean;
}
