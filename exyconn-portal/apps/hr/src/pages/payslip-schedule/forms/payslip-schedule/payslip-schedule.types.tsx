import type { PayrollScheduleQuery } from '@exyconn/shell/graphql/generated';

/** The stored schedule, exactly as the query returns it. */
export type PayslipScheduleRow = PayrollScheduleQuery['payrollSchedule'];

/** Form values for when payslip emails go out. */
export interface PayslipScheduleFormValues {
  enabled: boolean;
  dayOfMonth: number;
  hour: number;
  minute: number;
  period: string;
}
