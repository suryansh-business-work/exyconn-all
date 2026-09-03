import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * One person's signature on one VERSION of one policy.
 *
 * Keyed on (policyId, userId, version) rather than (policyId, userId): re-publishing a
 * policy with changed wording asks everybody again, and the old signature stays as the
 * record of what that person actually agreed to at the time. A signature that silently
 * carried over to new wording would be worthless as evidence.
 */
const policyAcknowledgementSchema = new Schema(
  {
    policyId: { type: String, required: true, index: true },
    policyTitle: { type: String, required: true, trim: true },
    /** The version signed. Never the policy's current version — the one they were shown. */
    version: { type: Number, required: true, min: 1 },
    userId: { type: String, required: true, index: true },
    userName: { type: String, default: '', trim: true },
    userEmail: { type: String, default: '', trim: true },
    /** Typed by the signer, as their signature. */
    signedName: { type: String, required: true, trim: true },
    signedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true },
);

policyAcknowledgementSchema.index({ policyId: 1, userId: 1, version: 1 }, { unique: true });

export type PolicyAcknowledgementDocument = InferSchemaType<typeof policyAcknowledgementSchema>;
export const PolicyAcknowledgementModel: Model<PolicyAcknowledgementDocument> =
  model<PolicyAcknowledgementDocument>('PolicyAcknowledgement', policyAcknowledgementSchema);
