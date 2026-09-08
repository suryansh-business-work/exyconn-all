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
    /**
     * The deductions total — the one figure every existing reader (the Finance summary, the
     * employee's list, the payslip) has always used. The named lines below add up to it
     * together with loss of pay, and are zero on slips generated before they existed.
     */
    deductions: { type: Number, required: true, min: 0, default: 0 },
    /** Employee provident fund contribution withheld this month. */
    pf: { type: Number, required: true, min: 0, default: 0 },
    /** Employee state insurance contribution withheld this month. */
    esi: { type: Number, required: true, min: 0, default: 0 },
    professionalTax: { type: Number, required: true, min: 0, default: 0 },
    tds: { type: Number, required: true, min: 0, default: 0 },
    /** The employee's own fixed deductions from their salary structure. */
    otherDeductions: { type: Number, required: true, min: 0, default: 0 },
    net: { type: Number, required: true, min: 0 },
    status: { type: String, enum: SLIP_STATUSES, required: true, default: 'GENERATED' },
    issuedDate: { type: Date, required: true },
    /**
     * The day the salary actually left the company. Stamped when the month is marked paid,
     * which is what lets the Finance cash summary count a salary on the day it moved rather
     * than the day it was accrued.
     */
    paidOn: { type: Date, default: null },
  },
  { timestamps: true },
);

salarySlipSchema.index({ employeeId: 1, year: 1, month: 1 }, { unique: true });

export type SalarySlipDocument = InferSchemaType<typeof salarySlipSchema>;

export const SalarySlipModel: Model<SalarySlipDocument> = model<SalarySlipDocument>(
  'SalarySlip',
  salarySlipSchema,
);
