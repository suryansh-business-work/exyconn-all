import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * The income-tax regimes and their slab tables.
 *
 * Two collections rather than one embedded array, because the numbers here are the ones a
 * finance act moves every year and an HR lead has to be able to correct without a release:
 * a slab row is edited, added and retired on its own, and each regime carries the figures
 * that only make sense next to its own bands — the standard deduction taken off pay before
 * the bands are walked, and the rebate that writes small tax bills down to nothing.
 *
 * NOTHING in here is a default worth trusting. `tax-slab.seed.ts` puts one year's figures in
 * so a fresh install computes something, and every one of them is editable in the portal.
 */

/**
 * One named regime for one financial year — "new regime", "old regime".
 *
 * Keyed on `regimeKey` + `financialYear` so both regimes exist side by side, each with its
 * own standard deduction and rebate, and last year's stays on file next to this year's. The
 * payroll settings name which key the next run applies; the year comes from the period being
 * run, so nobody has to remember to roll it over in April.
 */
const taxRegimeSchema = new Schema(
  {
    /** Short stable name, e.g. NEW or OLD. Slab rows point at this. */
    regimeKey: { type: String, required: true, trim: true },
    /** The financial year these figures are for, as `2026-27`. */
    financialYear: { type: String, required: true, trim: true },
    /** What HR sees in the picker, e.g. "New regime (default)". */
    name: { type: String, required: true, trim: true },
    /** Taken off annual pay before the bands are walked. */
    standardDeduction: { type: Number, required: true, min: 0, default: 0 },
    /**
     * Taxable income at or below which the rebate applies. An Indian payslip cannot be
     * computed without it: without the rebate, everybody just over the first band is
     * withheld tax they will get back a year later.
     */
    rebateIncomeLimit: { type: Number, required: true, min: 0, default: 0 },
    /** The most tax the rebate can wipe out. Applied before cess, never below zero. */
    rebateMaxTax: { type: Number, required: true, min: 0, default: 0 },
    /** Charged on the TAX, not on the income. 0 where the jurisdiction has none. */
    cessPercent: { type: Number, required: true, min: 0, max: 100, default: 0 },
    /** An inactive regime withholds nothing, so a half-entered table cannot tax anybody. */
    active: { type: Boolean, required: true, default: true },
  },
  { timestamps: true },
);
taxRegimeSchema.index({ regimeKey: 1, financialYear: 1 }, { unique: true });

/**
 * One band of one regime's table.
 *
 * `fromAmount` and `toAmount` are both stored rather than derived from the neighbouring
 * rows: a band edited in the portal has to say what it covers on its own, or reordering the
 * table silently re-cuts every band around it. `toAmount` is null for the open-ended top one.
 */
const taxSlabSchema = new Schema(
  {
    regimeKey: { type: String, required: true, trim: true },
    financialYear: { type: String, required: true, trim: true },
    /** Income above this falls in this band. The lowest band starts at 0. */
    fromAmount: { type: Number, required: true, min: 0, default: 0 },
    /** Income up to and including this is in this band. Null means "everything above". */
    toAmount: { type: Number, default: null },
    ratePercent: { type: Number, required: true, min: 0, max: 100, default: 0 },
    /** The order the bands are walked in, lowest first. */
    order: { type: Number, required: true, min: 0, default: 0 },
    /** An inactive band is skipped, so one can be retired without deleting the history. */
    active: { type: Boolean, required: true, default: true },
  },
  { timestamps: true },
);
taxSlabSchema.index({ regimeKey: 1, financialYear: 1, order: 1 });

export type TaxRegimeDocument = InferSchemaType<typeof taxRegimeSchema>;
export type TaxSlabDocument = InferSchemaType<typeof taxSlabSchema>;

export const TaxRegimeModel: Model<TaxRegimeDocument> = model<TaxRegimeDocument>(
  'TaxRegime',
  taxRegimeSchema,
);

export const TaxSlabModel: Model<TaxSlabDocument> = model<TaxSlabDocument>(
  'TaxSlab',
  taxSlabSchema,
);
