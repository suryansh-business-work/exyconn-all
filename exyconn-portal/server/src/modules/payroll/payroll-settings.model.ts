import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * How TDS is worked out for an employee.
 *
 * `NONE` deducts nothing. `FLAT_PERCENT` takes a percentage of taxable pay — the global
 * one, or the employee's own override. `SLAB` means the rate is worked out outside the
 * portal (an investment declaration, a chartered accountant) and recorded per employee on
 * their salary structure, so nobody without a recorded rate is taxed on a guess.
 */
export const TDS_MODES = ['NONE', 'FLAT_PERCENT', 'SLAB'] as const;
export type TdsMode = (typeof TDS_MODES)[number];

/**
 * Statutory deduction policy for the whole company — one document, like AppSettings,
 * identified by a fixed `key`.
 *
 * The defaults are the Indian statutory figures as they stand: PF at 12% of basic capped
 * at a ₹15,000 wage ceiling, ESI at 0.75% of gross for anyone earning ₹21,000 or less, and
 * professional tax at a flat ₹200 a month. They are settings rather than constants because
 * every one of them is a number a government changes without asking us.
 */
const payrollSettingsSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: 'global' },
    pfEnabled: { type: Boolean, required: true, default: true },
    pfEmployeePercent: { type: Number, required: true, min: 0, max: 100, default: 12 },
    /** PF is charged on basic only up to this figure; anything above it is exempt. */
    pfWageCeiling: { type: Number, required: true, min: 0, default: 15000 },
    esiEnabled: { type: Boolean, required: true, default: true },
    esiEmployeePercent: { type: Number, required: true, min: 0, max: 100, default: 0.75 },
    /** ESI applies only while gross is at or below this figure. */
    esiWageLimit: { type: Number, required: true, min: 0, default: 21000 },
    professionalTaxMonthly: { type: Number, required: true, min: 0, default: 200 },
    tdsMode: { type: String, enum: TDS_MODES, required: true, default: 'NONE' },
    tdsFlatPercent: { type: Number, required: true, min: 0, max: 100, default: 0 },
  },
  { timestamps: true },
);

export type PayrollSettingsDocument = InferSchemaType<typeof payrollSettingsSchema>;

export const PayrollSettingsModel: Model<PayrollSettingsDocument> =
  model<PayrollSettingsDocument>('PayrollSettings', payrollSettingsSchema);

/** The settings document, created with its defaults on first read. */
export async function readPayrollSettings(): Promise<PayrollSettingsDocument> {
  const doc = await PayrollSettingsModel.findOneAndUpdate(
    { key: 'global' },
    { $setOnInsert: { key: 'global' } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  ).lean();
  return doc as PayrollSettingsDocument;
}
