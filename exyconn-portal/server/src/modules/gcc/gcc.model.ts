import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * A read-only link to an estimate made in the exyconn.com GCC cost calculator.
 *
 * Only SHA-256 hashes of the link token and of the revoke key are stored; both are returned
 * once, at creation (the same rule as project share links). The estimate is kept as the
 * validated JSON the visitor sent — inputs only, never totals, so whoever opens the link sees
 * figures recomputed by the current engine. Expired links are purged by the TTL index.
 */
const gccShareSchema = new Schema(
  {
    tokenHash: { type: String, required: true, unique: true },
    revokeKeyHash: { type: String, required: true },
    /** Emptied when the link is revoked, so a revoked estimate is no longer held. */
    estimateJson: { type: String, default: '' },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

gccShareSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type GccShareDocument = InferSchemaType<typeof gccShareSchema>;

export const GccShareModel: Model<GccShareDocument> = model<GccShareDocument>(
  'GccShare',
  gccShareSchema,
);
