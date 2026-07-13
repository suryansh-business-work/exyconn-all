import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * Single document holding portal-wide date/time/timezone preferences that the UI
 * reads for dynamic formatting (CLAUDE.md rule 11). Identified by a fixed `key`.
 */
const settingsSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: 'global' },
    dateFormat: { type: String, required: true, default: 'dd MMM yyyy' },
    timeFormat: { type: String, required: true, default: 'hh:mm a' },
    timezone: { type: String, required: true, default: 'Asia/Kolkata' },
  },
  { timestamps: true },
);

export type AppSettingsDocument = InferSchemaType<typeof settingsSchema>;

export const AppSettingsModel: Model<AppSettingsDocument> = model<AppSettingsDocument>(
  'AppSettings',
  settingsSchema,
);
