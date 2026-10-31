import { PlanInterval, type BillingPlanFieldsFragment } from '@exyconn/shell/graphql/generated';

/** A plan as `signupPlans` returns it. */
export const signupPlan = (
  overrides: Partial<BillingPlanFieldsFragment> = {},
): BillingPlanFieldsFragment => ({
  __typename: 'BillingPlan',
  id: 'plan-growth',
  key: 'growth',
  name: 'Growth',
  description: '',
  prices: [{ __typename: 'PlanPrice', currency: 'USD', amount: 49 }],
  interval: PlanInterval.Month,
  trialDays: 14,
  seatLimit: 10,
  allModules: true,
  modules: [],
  aiMonthlyUsdCap: 0,
  isPublic: true,
  isActive: true,
  isSystem: false,
  sortOrder: 0,
  ...overrides,
});

/** What the first step hands the second once the code is sent. */
export const DETAILS = {
  name: 'Ada Lovelace',
  email: 'ada@newco.example',
  companyName: 'New Co',
  currency: 'GBP',
  country: 'GB',
  planId: 'plan-growth',
};
