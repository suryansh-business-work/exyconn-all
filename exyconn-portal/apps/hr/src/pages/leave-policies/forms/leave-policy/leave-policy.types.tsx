import type { ListLeavePoliciesPagedQuery } from '@exyconn/shell/graphql/generated';

export type LeavePolicyRow = ListLeavePoliciesPagedQuery['listLeavePoliciesPaged']['rows'][number];

export interface LeavePolicyFormValues {
  name: string;
  code: string;
  annualQuota: number | string;
  carryForwardCap: number | string;
  paid: string;
  halfDayAllowed: string;
  active: string;
}
