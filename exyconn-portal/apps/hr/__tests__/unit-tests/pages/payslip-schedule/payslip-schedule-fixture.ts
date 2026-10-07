import type { PayslipScheduleRow } from '../../../../src/pages/payslip-schedule/forms/payslip-schedule';

/** Payslips go out on the 3rd at 09:30 for the previous month; the last run was in October. */
export function payslipSchedule(over: Partial<PayslipScheduleRow> = {}): PayslipScheduleRow {
  return {
    enabled: true,
    dayOfMonth: 3,
    hour: 9,
    minute: 30,
    period: 'PREVIOUS_MONTH',
    lastRunAt: '2026-10-03T04:00:00.000Z',
    lastRunPeriod: '2026-09',
    lastSent: 41,
    lastFailed: 2,
    lastSkipped: 1,
    ...over,
  };
}
