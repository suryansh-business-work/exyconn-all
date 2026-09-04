import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { DEFAULT_CURRENCY, DEFAULT_PAY_TYPE, PAY_TYPES } from '../../constants/pay';

/**
 * One salary structure per employee (unique `employeeId`). The gross/net figures
 * are derived in the resolver from these components, so they live in one place.
 *
 * `payType` decides which of the amount fields below actually mean anything — see each
 * field. Everything is kept on ONE document rather than split per pay type: an employee
 * moves from a stipend to a salary without changing what row payroll and the tracker read.
 */
const salaryStructureSchema = new Schema(
  {
    employeeId: { type: String, required: true, trim: true, unique: true },
    currency: { type: String, required: true, trim: true, default: DEFAULT_CURRENCY },
    payType: { type: String, enum: PAY_TYPES, default: DEFAULT_PAY_TYPE },
    /** What "Other" means for this person; empty for the named pay types. */
    payTypeNote: { type: String, trim: true, default: null },
    // FIXED: the monthly components payroll builds a slip from. Zero for every other type.
    basic: { type: Number, required: true, min: 0, default: 0 },
    hra: { type: Number, required: true, min: 0, default: 0 },
    allowances: { type: Number, required: true, min: 0, default: 0 },
    deductions: { type: Number, required: true, min: 0, default: 0 },
    /**
     * The single amount the non-FIXED types are paid at: per HOUR for HOURLY, per MONTH for
     * STIPEND and OTHER. Ignored for FIXED, whose money is in the components above.
     */
    rate: { type: Number, min: 0, default: 0 },
    /**
     * What an hour of this person's tracked time is BILLED at — always per hour, whatever
     * they are paid. Kept apart from `rate` because pay and bill-out are different numbers
     * even for an hourly employee, and the tracker needs the second one.
     */
    billingRate: { type: Number, min: 0, default: 0 },
    effectiveFrom: { type: Date, required: true },
  },
  { timestamps: true },
);

export type SalaryStructureDocument = InferSchemaType<typeof salaryStructureSchema>;

export const SalaryStructureModel: Model<SalaryStructureDocument> = model<SalaryStructureDocument>(
  'SalaryStructure',
  salaryStructureSchema,
);
