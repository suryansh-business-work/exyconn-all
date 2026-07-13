import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * One salary structure per employee (unique `employeeId`). The gross/net figures
 * are derived in the resolver from these components, so they live in one place.
 */
const salaryStructureSchema = new Schema(
  {
    employeeId: { type: String, required: true, trim: true, unique: true },
    currency: { type: String, required: true, trim: true, default: 'INR' },
    basic: { type: Number, required: true, min: 0 },
    hra: { type: Number, required: true, min: 0, default: 0 },
    allowances: { type: Number, required: true, min: 0, default: 0 },
    deductions: { type: Number, required: true, min: 0, default: 0 },
    effectiveFrom: { type: Date, required: true },
  },
  { timestamps: true },
);

export type SalaryStructureDocument = InferSchemaType<typeof salaryStructureSchema>;

export const SalaryStructureModel: Model<SalaryStructureDocument> = model<SalaryStructureDocument>(
  'SalaryStructure',
  salaryStructureSchema,
);
