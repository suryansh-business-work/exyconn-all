import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { evidenceSchema } from './evidence.schema';

/** A decision the meeting reached, with the lines that show it was really made. */
const decisionSchema = new Schema(
  {
    meetingId: { type: String, required: true },
    /** sha1 of the normalised text, so regenerating notes updates rather than duplicates. */
    fingerprint: { type: String, required: true },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    evidence: { type: [evidenceSchema], default: [] },
    confidence: { type: Number, default: 0.5, min: 0, max: 1 },
  },
  { timestamps: true },
);

decisionSchema.index({ meetingId: 1, fingerprint: 1 }, { unique: true });

export type MaDecisionDocument = InferSchemaType<typeof decisionSchema>;

export const MaDecisionModel: Model<MaDecisionDocument> = model<MaDecisionDocument>(
  'MaDecision',
  decisionSchema,
);
