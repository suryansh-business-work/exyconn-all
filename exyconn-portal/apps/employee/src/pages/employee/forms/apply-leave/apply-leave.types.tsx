/** Form values for an employee leave application. */
export interface ApplyLeaveFormValues {
  /** The code of one of HR's leave types. */
  type: string;
  fromDate: string;
  toDate: string;
  reason: string;
}
