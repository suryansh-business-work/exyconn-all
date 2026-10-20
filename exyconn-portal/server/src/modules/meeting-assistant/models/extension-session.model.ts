import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * One signed-in copy of the Chrome extension. The refresh token is stored only as a hash and
 * rotates on every use; presenting a refresh token that was already rotated away means it was
 * copied, and revokes the whole session (see extension.auth).
 */
const extensionSessionSchema = new Schema(
  {
    userId: { type: String, required: true },
    extensionId: { type: String, required: true },
    refreshHash: { type: String, required: true },
    /** The hash before the last rotation: seeing it again is the theft signal. */
    previousRefreshHash: { type: String, default: null },
    deviceLabel: { type: String, default: '', maxlength: 200 },
    extensionVersion: { type: String, default: '', maxlength: 40 },
    userAgent: { type: String, default: '', maxlength: 500 },
    lastSeenAt: { type: Date, default: null },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    revokedReason: { type: String, default: '' },
  },
  { timestamps: true },
);

extensionSessionSchema.index({ refreshHash: 1 });
extensionSessionSchema.index({ previousRefreshHash: 1 });
extensionSessionSchema.index({ userId: 1, revokedAt: 1 });

export type MaExtensionSessionDocument = InferSchemaType<typeof extensionSessionSchema>;

export const MaExtensionSessionModel: Model<MaExtensionSessionDocument> =
  model<MaExtensionSessionDocument>('MaExtensionSession', extensionSessionSchema);

/**
 * A one-time authorization code from the portal's "Connect the extension" page (OAuth 2.0
 * authorization code + PKCE). Lives a minute, is stored hashed, and is spent on first use.
 */
const authCodeSchema = new Schema(
  {
    codeHash: { type: String, required: true },
    userId: { type: String, required: true },
    extensionId: { type: String, required: true },
    redirectUri: { type: String, required: true },
    codeChallenge: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

authCodeSchema.index({ codeHash: 1 }, { unique: true });
authCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 3600 });

export type MaAuthCodeDocument = InferSchemaType<typeof authCodeSchema>;

export const MaAuthCodeModel: Model<MaAuthCodeDocument> = model<MaAuthCodeDocument>(
  'MaAuthCode',
  authCodeSchema,
);
