import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * A machine's credential for this portal.
 *
 * Only the SHA-256 of the key is stored, and the plaintext exists exactly once — in the
 * response that created it. That is not a convenience trade: a key is a password for an
 * integration, and a database dump that can be replayed as a set of working credentials is
 * the whole reason API keys get rotated in a panic.
 *
 * `prefix` is the readable half kept in clear, so a key can be identified in a list and in a
 * log without ever storing the part that authenticates.
 */
const apiKeySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    /** The visible half — `exy_a1b2c3d4` — unique, so a log line names exactly one key. */
    prefix: { type: String, required: true, unique: true, trim: true },
    keyHash: { type: String, required: true, unique: true },
    /**
     * What this key may do, as portal roles.
     *
     * A key is never more powerful than a role somebody could hold: the same assertRole and
     * permission checks run for a machine as for a person, so there is one authorisation
     * model rather than a second one nobody audits.
     */
    roles: { type: [String], required: true, default: [] },
    createdBy: { type: String, default: '', trim: true },
    /** Stamped on use, so a key nobody calls can be found and removed. */
    lastUsedAt: { type: Date, default: null },
    /** Set when it is revoked. A revoked key is kept, so its history still reads. */
    revokedAt: { type: Date, default: null },
    /** Optional expiry. Null never expires, which is a choice somebody has to make. */
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export type ApiKeyDocument = InferSchemaType<typeof apiKeySchema>;
export const ApiKeyModel: Model<ApiKeyDocument> = model<ApiKeyDocument>('ApiKey', apiKeySchema);
