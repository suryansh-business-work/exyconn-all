import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * Settings for tracker builds. A single document — `key` is fixed so an upsert
 * always lands on the same row rather than growing a collection of near-copies.
 */
const trackerBuildSettingsSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: 'default' },
    /** Slack channel ids the finished installers are posted to. */
    slackChannels: { type: [String], required: true, default: [] },
  },
  { timestamps: true },
);

export type TrackerBuildSettingsDocument = InferSchemaType<typeof trackerBuildSettingsSchema>;

export const TrackerBuildSettingsModel: Model<TrackerBuildSettingsDocument> =
  model<TrackerBuildSettingsDocument>('TrackerBuildSettings', trackerBuildSettingsSchema);
