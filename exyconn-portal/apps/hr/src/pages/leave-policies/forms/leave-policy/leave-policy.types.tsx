import type { ListLeavePoliciesPagedQuery } from '@exyconn/shell/graphql/generated';

export type LeavePolicyRow = ListLeavePoliciesPagedQuery['listLeavePoliciesPaged']['rows'][number];

/** One country's own terms, as the form edits them. */
export interface LeavePolicyOverrideValues {
  country: string;
  annualQuota: number | string;
  carryForwardCap: number | string;
  active: boolean;
}

export interface LeavePolicyFormValues {
  name: string;
  code: string;
  annualQuota: number | string;
  carryForwardCap: number | string;
  paid: string;
  halfDayAllowed: string;
  active: string;
  overrides: LeavePolicyOverrideValues[];
}
