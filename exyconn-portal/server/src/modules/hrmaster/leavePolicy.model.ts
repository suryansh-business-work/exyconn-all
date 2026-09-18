import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { isValidCountry } from '../../utils/iso';

/**
 * One country's own terms for a leave type. Every field is stated in full rather than
 * partially inherited: HR reads an override row as "in this country it is exactly this",
 * and a row that silently mixed in global values would say something else.
 */
const countryOverrideSchema = new Schema(
  {
    /** ISO 3166-1 alpha-2. */
    country: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      validate: { validator: isValidCountry, message: '"{VALUE}" is not an ISO 3166-1 country' },
    },
    annualQuota: { type: Number, required: true, min: 0, default: 0 },
    carryForwardCap: { type: Number, required: true, min: 0, default: 0 },
    /** Offered in this country — true even when the global type is off (a local-only type). */
    active: { type: Boolean, required: true, default: true },
  },
  { _id: false },
);

/** Each country is overridden at most once, or which row applies would be a coin toss. */
function uniqueCountries(rows: { country: string }[]): boolean {
  const countries = rows.map((row) => row.country.toUpperCase());
  return new Set(countries).size === countries.length;
}

const leavePolicySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    /** Short code shown on balances and slips, e.g. CL, SL, EL. */
    code: { type: String, required: true, trim: true, uppercase: true },
    /** Days granted per year. Zero means unlimited/unmetered (e.g. unpaid). */
    annualQuota: { type: Number, required: true, min: 0, default: 0 },
    paid: { type: Boolean, required: true, default: true },
    halfDayAllowed: { type: Boolean, required: true, default: true },
    /** Unused days that roll into next year, capped at this many. */
    carryForwardCap: { type: Number, required: true, min: 0, default: 0 },
    active: { type: Boolean, required: true, default: true },
    /** Per-country terms; a country with no row gets the global ones above. */
    overrides: {
      type: [countryOverrideSchema],
      default: [],
      validate: { validator: uniqueCountries, message: 'Each country can be overridden once' },
    },
  },
  { timestamps: true },
);

leavePolicySchema.index({ code: 1 }, { unique: true });

export type LeavePolicyDocument = InferSchemaType<typeof leavePolicySchema>;
export const LeavePolicyModel: Model<LeavePolicyDocument> = model<LeavePolicyDocument>(
  'LeavePolicy',
  leavePolicySchema,
);
