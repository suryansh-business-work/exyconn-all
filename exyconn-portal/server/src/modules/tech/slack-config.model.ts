import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * A reusable Slack workspace configuration managed from the Admin module's
 * Environment Variables screen (DB-backed, no env dependency). Exactly one
 * document is `isActive` at a time and is used for outgoing notifications.
 */
const slackConfigSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    botToken: { type: String, required: true, trim: true },
    defaultChannel: { type: String, required: true, trim: true },
    isActive: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

export type SlackConfigDocument = InferSchemaType<typeof slackConfigSchema>;

export const SlackConfigModel: Model<SlackConfigDocument> = model<SlackConfigDocument>(
  'SlackConfig',
  slackConfigSchema,
);
