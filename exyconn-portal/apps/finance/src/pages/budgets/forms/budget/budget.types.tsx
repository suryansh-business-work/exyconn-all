import type { ListBudgetsPagedQuery } from '@exyconn/shell/graphql/generated';

export type BudgetRow = ListBudgetsPagedQuery['listBudgetsPaged']['rows'][number];

/** One option in the cost centre picker. */
export interface CostCenterOption {
  value: string;
  label: string;
}
