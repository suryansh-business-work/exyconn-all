import type { ListLeaveRequestsQuery, LeaveStatus } from '@exyconn/shell/graphql/generated';

export type LeaveRequestRow = ListLeaveRequestsQuery['listLeaveRequests'][number];

export interface LeaveRequestFormValues {
  employeeId: string;
  /** The code of one of HR's leave types. */
  type: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: LeaveStatus;
}
