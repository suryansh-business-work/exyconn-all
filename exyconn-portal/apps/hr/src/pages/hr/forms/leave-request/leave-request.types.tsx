import type {
  ListLeaveRequestsQuery,
  LeaveType,
  LeaveStatus,
} from '@exyconn/shell/graphql/generated';

export type LeaveRequestRow = ListLeaveRequestsQuery['listLeaveRequests'][number];

export interface LeaveRequestFormValues {
  employeeId: string;
  type: LeaveType;
  fromDate: string;
  toDate: string;
  reason: string;
  status: LeaveStatus;
}
