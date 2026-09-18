import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { IT_ACCESS_KINDS, IT_ACCESS_STATUSES } from '../itsm.enums';

/**
 * One request to change what an employee can get into: grant an application, change their
 * role in it, revoke it, or reset its password. Kept as a history rather than a current
 * state — what someone holds today is read off the latest FULFILLED request per application,
 * so every grant and revoke stays on record with who asked and who approved it.
 *
 * A password reset never carries the password. IT resets it in the system itself; this
 * records that it was asked for, approved and done.
 */
const accessRequestSchema = new Schema(
  {
    employeeId: { type: String, required: true, trim: true, index: true },
    employeeName: { type: String, default: '', trim: true },
    application: { type: String, required: true, trim: true },
    kind: { type: String, enum: IT_ACCESS_KINDS, required: true, default: 'GRANT' },
    /** The role or level asked for, e.g. "Editor". Empty for a revoke or a reset. */
    accessLevel: { type: String, default: '', trim: true },
    reason: { type: String, required: true, trim: true },
    status: { type: String, enum: IT_ACCESS_STATUSES, required: true, default: 'PENDING' },
    requestedById: { type: String, default: '', trim: true },
    requestedByName: { type: String, default: '', trim: true },
    decidedByName: { type: String, default: '', trim: true },
    decidedAt: { type: Date, default: null },
    decisionNote: { type: String, default: '', trim: true },
    fulfilledAt: { type: Date, default: null },
    /** When a temporary grant should be taken back again. */
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export type ItAccessRequestDocument = InferSchemaType<typeof accessRequestSchema>;
export const ItAccessRequestModel: Model<ItAccessRequestDocument> = model<ItAccessRequestDocument>(
  'ItAccessRequest',
  accessRequestSchema,
);
