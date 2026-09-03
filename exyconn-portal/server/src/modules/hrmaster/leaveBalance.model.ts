import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * One employee's entitlement for one leave type in one year. HR allocates and
 * adjusts; `used` is what approved leave has consumed. Kept as its own document
 * rather than derived, because carry-forward and manual adjustments cannot be
 * recomputed from the request history alone.
 */
const leaveBalanceSchema = new Schema(
  {
    employeeId: { type: String, required: true, index: true },
    leaveTypeCode: { type: String, required: true, uppercase: true, trim: true },
    year: { type: Number, required: true },
    allocated: { type: Number, required: true, min: 0, default: 0 },
    carriedForward: { type: Number, required: true, min: 0, default: 0 },
    used: { type: Number, required: true, min: 0, default: 0 },
    /** Manual correction, positive or negative. */
    adjustment: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

leaveBalanceSchema.index({ employeeId: 1, leaveTypeCode: 1, year: 1 }, { unique: true });

export type LeaveBalanceDocument = InferSchemaType<typeof leaveBalanceSchema>;
export const LeaveBalanceModel: Model<LeaveBalanceDocument> = model<LeaveBalanceDocument>(
  'LeaveBalance',
  leaveBalanceSchema,
);
