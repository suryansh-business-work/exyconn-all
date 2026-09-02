import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

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
  },
  { timestamps: true },
);

leavePolicySchema.index({ code: 1 }, { unique: true });

export type LeavePolicyDocument = InferSchemaType<typeof leavePolicySchema>;
export const LeavePolicyModel: Model<LeavePolicyDocument> = model<LeavePolicyDocument>(
  'LeavePolicy',
  leavePolicySchema,
);
