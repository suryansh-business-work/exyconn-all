import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * A one-time sign-in code emailed to somebody without a password: a WhatsApp demo visitor or
 * a client hub contact. `purpose` keeps one flow's codes from ever opening the other. Only
 * the keyed hash is stored; a code works once, for a few minutes and a few guesses, and a new
 * request spends any earlier one. Filed in the company the sign-in belongs to.
 */
const emailCodeSchema = new Schema(
  {
    purpose: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, required: true, default: 0 },
    usedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

emailCodeSchema.index({ purpose: 1, email: 1, createdAt: -1 });
emailCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type EmailCodeDocument = InferSchemaType<typeof emailCodeSchema>;

export const EmailCodeModel: Model<EmailCodeDocument> = model<EmailCodeDocument>(
  'EmailSignInCode',
  emailCodeSchema,
);
