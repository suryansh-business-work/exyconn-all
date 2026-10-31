import type { SubscriptionStatus } from '@exyconn/shell/graphql/generated';

/** The plan a platform administrator puts a company on by hand, and its status there. */
export interface OrganizationPlanFormValues {
  planId: string;
  status: SubscriptionStatus;
}
