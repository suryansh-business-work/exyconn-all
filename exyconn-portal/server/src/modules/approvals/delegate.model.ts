import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * One person standing in for another's approvals while they are away.
 *
 * Without this, a manager on two weeks' leave is a two-week hold on every leave request,
 * expense claim and access request behind them — and the workaround people actually reach
 * for is sharing a password, which is worse than anything this could get wrong.
 *
 * A window rather than a switch: somebody setting this on the way out of the door should not
 * have to remember to turn it off when they come back.
 */
const approvalDelegateSchema = new Schema(
  {
    /** Whose approvals are being covered. */
    fromEmployeeId: { type: String, required: true, index: true },
    /** Who is covering them. */
    toEmployeeId: { type: String, required: true, index: true },
    /** Inclusive, in the workspace's own days — a delegation "until Friday" includes Friday. */
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },
    /** Why, for whoever reads the audit trail later. */
    note: { type: String, default: '', trim: true },
  },
  { timestamps: true },
);

// The queue asks "who am I covering today?" on every read, so that is the indexed question.
approvalDelegateSchema.index({ toEmployeeId: 1, fromDate: 1, toDate: 1 });

export type ApprovalDelegateDocument = InferSchemaType<typeof approvalDelegateSchema>;
export const ApprovalDelegateModel: Model<ApprovalDelegateDocument> =
  model<ApprovalDelegateDocument>('ApprovalDelegate', approvalDelegateSchema);
