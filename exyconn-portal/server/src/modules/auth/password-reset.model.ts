import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * One self-service reset link. Only the SHA-256 of the token is stored, so a copy of the
 * collection cannot be turned into a working link; the token itself lives only in the email.
 */
const passwordResetTokenSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export type PasswordResetTokenDocument = InferSchemaType<typeof passwordResetTokenSchema>;

export const PasswordResetTokenModel: Model<PasswordResetTokenDocument> =
  model<PasswordResetTokenDocument>('PasswordResetToken', passwordResetTokenSchema);
