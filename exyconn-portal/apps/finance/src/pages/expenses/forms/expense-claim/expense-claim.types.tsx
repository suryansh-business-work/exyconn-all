import type { ListExpenseClaimsPagedQuery, ExpenseStatus } from '@exyconn/shell/graphql/generated';

export type ExpenseClaimRow = ListExpenseClaimsPagedQuery['listExpenseClaimsPaged']['rows'][number];

export interface ExpenseClaimFormValues {
  employeeId: string;
  category: string;
  description: string;
  amount: number | string;
  currency: string;
  incurredOn: string;
  receiptUrl: string;
  status: ExpenseStatus;
  approvedAmount: number | string;
}
