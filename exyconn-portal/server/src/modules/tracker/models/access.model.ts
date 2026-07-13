import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * Grants an employee the right to use the desktop tracker. Without an active grant the
 * app refuses to sign in, so tracking can never start for someone who was not explicitly
 * given access (and emailed about it).
 */
const trackerAccessSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    grantedBy: { type: String, required: true },
    grantedAt: { type: Date, required: true, default: Date.now },
    revokedAt: { type: Date, default: null },
    revokedBy: { type: String, default: '' },
    isActive: { type: Boolean, required: true, default: true },
    /** Whether the employee has accepted the in-app consent screen, and when. */
    consentedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export type TrackerAccessDocument = InferSchemaType<typeof trackerAccessSchema>;
export const TrackerAccessModel: Model<TrackerAccessDocument> = model<TrackerAccessDocument>(
  'TrackerAccess',
  trackerAccessSchema,
);
