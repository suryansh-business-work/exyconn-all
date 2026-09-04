import type { LicenceFieldsFragment } from '@exyconn/shell/graphql/generated';

export type LicenceRow = LicenceFieldsFragment;

export interface LicenceFormValues {
  name: string;
  vendor: string;
  seatsTotal: number;
  assigneeIds: string[];
  cost: number;
  billingCycle: string;
  renewalDate: Date | null;
  status: string;
  notes: string;
}
