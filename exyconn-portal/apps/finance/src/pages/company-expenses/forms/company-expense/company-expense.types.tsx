import type { CompanyExpenseFieldsFragment } from '@exyconn/shell/graphql/generated';

export type CompanyExpenseRow = CompanyExpenseFieldsFragment;

export interface CompanyExpenseFormValues {
  vendor: string;
  category: string;
  description: string;
  amount: number;
  currency: string;
  incurredOn: string;
  dueDate: string;
  reference: string;
}
