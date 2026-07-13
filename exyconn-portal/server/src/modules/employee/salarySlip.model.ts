import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/** Payout state of a monthly payslip. */
export const SLIP_STATUSES = ['GENERATED', 'PAID'] as const;

/**
 * A monthly payslip snapshot for an employee. The unique `{ employeeId, year,
 * month }` index makes payslip generation an idempotent per-month upsert.
 */
const salarySlipSchema = new Schema(
  {
    employeeId: { type: String, required: true, trim: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    currency: { type: String, required: true, trim: true, default: 'INR' },
    gross: { type: Number, required: true, min: 0 },
    deductions: { type: Number, required: true, min: 0, default: 0 },
    net: { type: Number, required: true, min: 0 },
    status: { type: String, enum: SLIP_STATUSES, required: true, default: 'GENERATED' },
    issuedDate: { type: Date, required: true },
  },
  { timestamps: true },
);

salarySlipSchema.index({ employeeId: 1, year: 1, month: 1 }, { unique: true });

export type SalarySlipDocument = InferSchemaType<typeof salarySlipSchema>;

export const SalarySlipModel: Model<SalarySlipDocument> = model<SalarySlipDocument>(
  'SalarySlip',
  salarySlipSchema,
);
