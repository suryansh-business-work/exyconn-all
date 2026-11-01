import type {
  BillingPlanFieldsFragment,
  PlanInterval,
  Role,
} from '@exyconn/shell/graphql/generated';

/** A plan as the catalogue lists it. */
export type PlanRow = BillingPlanFieldsFragment;

/** One price of a plan as the form edits it. */
export interface PlanPriceFormValue {
  currency: string;
  amount: number;
}

/** A plan's price, limits and modules, as Admin › Plans edits them. */
export interface PlanFormValues {
  key: string;
  name: string;
  description: string;
  prices: PlanPriceFormValue[];
  interval: PlanInterval;
  trialDays: number;
  seatLimit: number;
  allModules: boolean;
  modules: Role[];
  aiMonthlyUsdCap: number;
  isPublic: boolean;
  isActive: boolean;
  sortOrder: number;
}
