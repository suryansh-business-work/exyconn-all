import type { ListLeaveBalancesPagedQuery } from '@exyconn/shell/graphql/generated';

export type LeaveBalanceRow = ListLeaveBalancesPagedQuery['listLeaveBalancesPaged']['rows'][number];

export interface LeaveBalanceFormValues {
  employeeId: string;
  leaveTypeCode: string;
  year: number | string;
  allocated: number | string;
  carriedForward: number | string;
  used: number | string;
  adjustment: number | string;
}
