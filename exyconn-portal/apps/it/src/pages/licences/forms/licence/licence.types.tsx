import type { LicenceFieldsFragment } from '@exyconn/shell/graphql/generated';

export type LicenceRow = LicenceFieldsFragment;

export interface LicenceFormValues {
  name: string;
  vendor: string;
  seatsTotal: number;
  assigneeIds: string[];
  cost: number;
  billingCycle: string;
  /** ISO string from the picker. */
  renewalDate: string;
  status: string;
  notes: string;
}
