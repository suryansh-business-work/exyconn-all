import type { AttendanceStatus } from '@/graphql/generated';

/** Form values for an employee's manual attendance entry. */
export interface MarkAttendanceFormValues {
  date: string;
  status: AttendanceStatus;
  note: string;
}
