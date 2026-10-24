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
    /** Slack channel ids a status incident opening or resolving is posted to. */
    statusAlertChannels: { type: [String], required: true, default: [] },
    /** How many of the newest builds the retention loop keeps; 0 keeps every build. */
    keepLatestBuilds: { type: Number, required: true, min: 0, default: 0 },
  },
  { timestamps: true },
);

export type TrackerBuildSettingsDocument = InferSchemaType<typeof trackerBuildSettingsSchema>;

export const TrackerBuildSettingsModel: Model<TrackerBuildSettingsDocument> =
  model<TrackerBuildSettingsDocument>('TrackerBuildSettings', trackerBuildSettingsSchema);
