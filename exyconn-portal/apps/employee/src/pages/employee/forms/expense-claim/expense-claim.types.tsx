import type { MyExpenseClaimsQuery } from '@exyconn/shell/graphql/generated';

export type MyExpenseClaimRow = MyExpenseClaimsQuery['myExpenseClaims'][number];

export interface ExpenseClaimFormValues {
  category: string;
  description: string;
  amount: number;
  currency: string;
  incurredOn: string;
  receiptUrl: string;
}
