import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * The company's real WhatsApp Business number (Meta WhatsApp Cloud API), which runs the same
 * published demo workflows as the browser chat. One per company.
 *
 * `accessToken` and `appSecret` are sealed at rest (utils/secretBox) and never returned by the
 * API. `phoneNumberId` is how a webhook delivery finds its company, so the service keeps it
 * unique across every company, not only within one.
 */
const whatsappChannelSchema = new Schema(
  {
    phoneNumberId: { type: String, required: true, trim: true, index: true },
    /** The number as people dial it, shown in the admin screen only. */
    displayPhone: { type: String, default: '', trim: true },
    accessToken: { type: String, required: true },
    appSecret: { type: String, required: true },
    /** What Meta echoes back when the webhook is registered. Not a credential. */
    verifyToken: { type: String, required: true, trim: true, index: true },
    enabled: { type: Boolean, required: true, default: false },
    updatedByName: { type: String, default: null },
  },
  { timestamps: true },
);

export type WhatsappChannelDocument = InferSchemaType<typeof whatsappChannelSchema>;

export const WhatsappChannelModel: Model<WhatsappChannelDocument> = model<WhatsappChannelDocument>(
  'WhatsappChannel',
  whatsappChannelSchema,
);
