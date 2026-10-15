import type { CompanyFieldsFragment } from '@exyconn/shell/graphql/generated';
import type { CustomFormValues } from '../../../../records/custom-fields';

export type CompanyRow = CompanyFieldsFragment;

export interface CompanyFormValues {
  name: string;
  domain: string;
  industry: string;
  size: string;
  status: string;
  phone: string;
  location: string;
  owner: string;
  notes: string;
  custom: CustomFormValues;
}
