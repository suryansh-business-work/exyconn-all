import type { SupplierFieldsFragment } from '@exyconn/shell/graphql/generated';

export type SupplierRow = SupplierFieldsFragment;

export interface SupplierFormValues {
  name: string;
  code: string;
  contactName: string;
  email: string;
  phone: string;
  status: string;
  notes: string;
}
