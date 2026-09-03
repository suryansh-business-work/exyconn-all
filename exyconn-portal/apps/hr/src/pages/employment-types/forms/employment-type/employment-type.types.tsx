import type { ListEmploymentTypesPagedQuery } from '@exyconn/shell/graphql/generated';

export type EmploymentTypeRow =
  ListEmploymentTypesPagedQuery['listEmploymentTypesPaged']['rows'][number];

export interface EmploymentTypeFormValues {
  name: string;
  code: string;
  description: string;
  payrollEligible: string;
  active: string;
}
