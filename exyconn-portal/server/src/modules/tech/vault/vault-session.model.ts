import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/** Whether the browser shared where the device was when the vault was opened. */
export const VAULT_LOCATION_STATES = ['GRANTED', 'DENIED', 'UNAVAILABLE'] as const;

/** How a session ended: its 30 minutes ran out, or the person locked it themselves. */
export const VAULT_END_REASONS = ['EXPIRED', 'LOCKED'] as const;

/**
 * One unlock of Tech > Environment Variables: who opened it, why, from which address, browser
 * and place, and until when. Append-only history — a session is ended, never deleted — so
 * "who could see the SMTP password on Tuesday" has an answer. Platform-wide, like the configs.
 */
const vaultSessionSchema = new Schema(
  {
    userId: { type: String, required: true },
    userName: { type: String, default: '' },
    email: { type: String, required: true },
    /** What they said they were opening it for. */
    reason: { type: String, required: true, trim: true },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    location: {
      state: { type: String, enum: VAULT_LOCATION_STATES, default: 'UNAVAILABLE' },
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      /** Metres, as the browser reports it. */
      accuracy: { type: Number, default: null },
    },
    unlockedAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
    endedAt: { type: Date, default: null },
    endReason: { type: String, enum: [...VAULT_END_REASONS, null], default: null },
  },
  { timestamps: true },
);

vaultSessionSchema.index({ userId: 1, expiresAt: -1 });
vaultSessionSchema.index({ unlockedAt: -1 });

export type VaultSessionDocument = InferSchemaType<typeof vaultSessionSchema>;
export const VaultSessionModel: Model<VaultSessionDocument> = model<VaultSessionDocument>(
  'TechVaultSession',
  vaultSessionSchema,
);
