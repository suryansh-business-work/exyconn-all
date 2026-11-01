import {
  PlanInterval,
  Role,
  SubscriptionProvider,
  SubscriptionStatus,
  type BillingOverviewFieldsFragment,
  type BillingPlanFieldsFragment,
  type BillingSubscriptionFieldsFragment,
} from '@exyconn/shell/graphql/generated';

/** A plan as the billing queries return it. */
export const plan = (
  overrides: Partial<BillingPlanFieldsFragment> = {},
): BillingPlanFieldsFragment => ({
  __typename: 'BillingPlan',
  id: 'plan-growth',
  key: 'growth',
  name: 'Growth',
  description: 'For growing teams',
  prices: [
    { __typename: 'PlanPrice', currency: 'USD', amount: 49 },
    { __typename: 'PlanPrice', currency: 'INR', amount: 3999 },
  ],
  interval: PlanInterval.Month,
  trialDays: 14,
  seatLimit: 10,
  allModules: false,
  modules: [Role.Crm, Role.Hr],
  aiMonthlyUsdCap: 25,
  isPublic: true,
  isActive: true,
  isSystem: false,
  sortOrder: 1,
  ...overrides,
});

/** A company's subscription row. */
export const subscription = (
  overrides: Partial<BillingSubscriptionFieldsFragment> = {},
): BillingSubscriptionFieldsFragment => ({
  __typename: 'BillingSubscription',
  id: 'sub-1',
  planId: 'plan-growth',
  planKey: 'growth',
  status: SubscriptionStatus.Trialing,
  provider: SubscriptionProvider.None,
  currency: '',
  trialEndsAt: '2026-11-15T00:00:00.000Z',
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  cancelledAt: null,
  ...overrides,
});

/** Admin › Billing's overview: on Growth's trial, two plans offered. */
export const overview = (
  overrides: Partial<BillingOverviewFieldsFragment> = {},
): BillingOverviewFieldsFragment => ({
  __typename: 'BillingOverview',
  lapsed: false,
  seatsUsed: 3,
  aiSpentThisMonthUsd: 4.5,
  providers: [],
  subscription: subscription(),
  plan: plan(),
  plans: [
    plan(),
    plan({
      id: 'plan-scale',
      key: 'scale',
      name: 'Scale',
      interval: PlanInterval.Year,
      allModules: true,
      modules: [],
      seatLimit: 0,
      aiMonthlyUsdCap: 0,
    }),
  ],
  ...overrides,
});
