import type { LeaveType } from '@/graphql/generated';

/** Form values for an employee leave application. */
export interface ApplyLeaveFormValues {
  type: LeaveType;
  fromDate: string;
  toDate: string;
  reason: string;
}
