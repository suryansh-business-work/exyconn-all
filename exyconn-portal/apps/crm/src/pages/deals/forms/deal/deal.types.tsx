import type { DealFieldsFragment } from '@exyconn/shell/graphql/generated';

export type DealRow = DealFieldsFragment;

export interface DealFormValues {
  title: string;
  companyId: string;
  contactId: string;
  stage: string;
  value: number;
  probability: number;
  expectedCloseDate: Date | null;
  owner: string;
  notes: string;
}
