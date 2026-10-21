import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * A person's Google account connected with the Meet read-only scope, so the official
 * transcript and participant list of their calls can be imported. The refresh token is sealed
 * (utils/secretBox) and never leaves the server.
 */
const connectionSchema = new Schema(
  {
    userId: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    refreshToken: { type: String, required: true },
    lastError: { type: String, default: '' },
  },
  { timestamps: true },
);

connectionSchema.index({ userId: 1 }, { unique: true });

export type MaGoogleConnectionDocument = InferSchemaType<typeof connectionSchema>;

export const MaGoogleConnectionModel: Model<MaGoogleConnectionDocument> =
  model<MaGoogleConnectionDocument>('MaGoogleConnection', connectionSchema);

/** A Google connection in progress, read by the OAuth callback before any company is known. */
const stateSchema = new Schema(
  {
    nonce: { type: String, required: true },
    codeVerifier: { type: String, required: true },
    returnTo: { type: String, required: true },
    userId: { type: String, required: true },
    userName: { type: String, default: '' },
    organizationId: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

stateSchema.index({ nonce: 1 }, { unique: true });
stateSchema.index({ createdAt: 1 }, { expireAfterSeconds: 900 });

export type MaGoogleStateDocument = InferSchemaType<typeof stateSchema>;

export const MaGoogleStateModel: Model<MaGoogleStateDocument> = model<MaGoogleStateDocument>(
  'MaGoogleOAuthState',
  stateSchema,
);
