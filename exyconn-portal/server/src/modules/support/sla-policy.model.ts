import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { SUPPORT_PRIORITIES } from '../employee/support.model';

/**
 * What the support team promises for each priority: how fast somebody answers, and
 * how fast it is finished. One row per priority — the priority is the key, so a
 * ticket's promise is a single lookup and there is nothing to reconcile.
 */
const slaPolicySchema = new Schema(
  {
    priority: {
      type: String,
      enum: SUPPORT_PRIORITIES,
      required: true,
      unique: true,
      trim: true,
    },
    firstResponseMinutes: { type: Number, required: true, min: 1 },
    resolutionMinutes: { type: Number, required: true, min: 1 },
    /** An inactive policy promises nothing: tickets on that priority get no deadline. */
    active: { type: Boolean, required: true, default: true },
  },
  { timestamps: true },
);

export type SupportSlaPolicyDocument = InferSchemaType<typeof slaPolicySchema>;

export const SupportSlaPolicyModel: Model<SupportSlaPolicyDocument> =
  model<SupportSlaPolicyDocument>('SupportSlaPolicy', slaPolicySchema);

/**
 * The starting promises, seeded on boot when absent. Deliberately modest so they are
 * believable on day one; the team edits them in Support › SLA Policies.
 */
export const DEFAULT_SLA_POLICIES = [
  { priority: 'HIGH', firstResponseMinutes: 60, resolutionMinutes: 480, active: true },
  { priority: 'MEDIUM', firstResponseMinutes: 240, resolutionMinutes: 1440, active: true },
  { priority: 'LOW', firstResponseMinutes: 480, resolutionMinutes: 2880, active: true },
] as const;
