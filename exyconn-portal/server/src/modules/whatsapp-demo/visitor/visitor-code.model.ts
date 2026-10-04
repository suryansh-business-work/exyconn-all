import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * A one-time sign-in code emailed to a demo visitor. Only its keyed hash is stored; it works
 * once, for a few minutes and a few attempts, and a new request spends any earlier one.
 */
const visitorCodeSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, required: true, default: 0 },
    usedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

visitorCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type VisitorCodeDocument = InferSchemaType<typeof visitorCodeSchema>;

export const WhatsappDemoVisitorCodeModel: Model<VisitorCodeDocument> = model<VisitorCodeDocument>(
  'WhatsappDemoVisitorCode',
  visitorCodeSchema,
);
