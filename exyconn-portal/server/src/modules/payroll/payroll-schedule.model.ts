import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/** Which month's slips a scheduled run sends when it fires. */
export const PAYROLL_DISPATCH_PERIODS = ['PREVIOUS_MONTH', 'CURRENT_MONTH'] as const;

/** The 29th–31st do not exist in every month, so a schedule may not name them. */
export const MAX_SCHEDULE_DAY = 28;

/**
 * When payslips go out, as one document HR edits (same singleton pattern as AppSettings).
 *
 * `lastRunPeriod` is the month a run last sent for, not a timestamp: it is what makes the
 * schedule idempotent, so a restart, a second app instance or a manual send during the
 * scheduled window cannot email an employee their payslip twice.
 */
const payrollScheduleSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: 'global' },
    enabled: { type: Boolean, required: true, default: false },
    dayOfMonth: { type: Number, required: true, min: 1, max: MAX_SCHEDULE_DAY, default: 1 },
    hour: { type: Number, required: true, min: 0, max: 23, default: 10 },
    minute: { type: Number, required: true, min: 0, max: 59, default: 0 },
    period: {
      type: String,
      enum: PAYROLL_DISPATCH_PERIODS,
      required: true,
      default: 'PREVIOUS_MONTH',
    },
    lastRunAt: { type: Date, default: null },
    /** The period the last run sent for, as `YYYY-MM`. Empty until the first run. */
    lastRunPeriod: { type: String, default: '', trim: true },
    lastSent: { type: Number, required: true, default: 0 },
    lastFailed: { type: Number, required: true, default: 0 },
    lastSkipped: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

export type PayrollScheduleDocument = InferSchemaType<typeof payrollScheduleSchema>;

export const PayrollScheduleModel: Model<PayrollScheduleDocument> = model<PayrollScheduleDocument>(
  'PayrollSchedule',
  payrollScheduleSchema,
);
