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

/**
 * The regime SLAB mode reaches for, and the month a financial year opens in, until HR says
 * otherwise. Exported because `.lean()` skips Mongoose defaults: a settings document written
 * before the tax table existed comes back without these fields and every reader has to land
 * on the same two values the schema would have given it.
 */
export const DEFAULT_TDS_REGIME_KEY = 'NEW';
export const DEFAULT_FINANCIAL_YEAR_START_MONTH = 4;

/** One band of the TDS table. `upTo` is null for the open-ended top band. */
const tdsSlabSchema = new Schema(
  {
    /** Income up to and including this is taxed at `percent`. Null means "everything above". */
    upTo: { type: Number, default: null },
    percent: { type: Number, required: true, min: 0, max: 100 },
  },
  { _id: false },
);
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
    /**
     * The slab table SLAB mode applies, entered by whoever knows the current finance act.
     *
     * Empty by default and deliberately so: an unconfigured portal withholds nothing rather
     * than taxing somebody at a rate this repository invented.
     */
    tdsSlabs: { type: [tdsSlabSchema], default: [] },
    /** Deducted from annual taxable pay before the slabs are applied. */
    tdsAnnualExemption: { type: Number, required: true, min: 0, default: 0 },
    /** Charged on the TAX, not on the income. 0 where the jurisdiction has none. */
    tdsCessPercent: { type: Number, required: true, min: 0, max: 100, default: 0 },
    /**
     * Which regime in the `TaxRegime` table SLAB mode applies — the key, not the year: the
     * year comes from the period being run, so nobody has to roll this over every April.
     */
    tdsRegimeKey: { type: String, required: true, trim: true, default: DEFAULT_TDS_REGIME_KEY },
    /**
     * The month a financial year opens in, 1-12. April in India, which is what the seeded
     * table is written for; a workspace on a calendar tax year sets it to 1.
     */
    financialYearStartMonth: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
      default: DEFAULT_FINANCIAL_YEAR_START_MONTH,
    },
  },
  { timestamps: true },
);

export type PayrollSettingsDocument = InferSchemaType<typeof payrollSettingsSchema>;

export const PayrollSettingsModel: Model<PayrollSettingsDocument> = model<PayrollSettingsDocument>(
  'PayrollSettings',
  payrollSettingsSchema,
);

/** The settings document, created with its defaults on first read. */
export async function readPayrollSettings(): Promise<PayrollSettingsDocument> {
  const doc = await PayrollSettingsModel.findOneAndUpdate(
    { key: 'global' },
    { $setOnInsert: { key: 'global' } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  ).lean();
  return doc as PayrollSettingsDocument;
}
