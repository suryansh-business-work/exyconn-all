import type { AttendanceStatus } from '@exyconn/shell/graphql/generated';

/** Form values for an employee's manual attendance entry. */
export interface MarkAttendanceFormValues {
  date: string;
  status: AttendanceStatus;
  note: string;
}
