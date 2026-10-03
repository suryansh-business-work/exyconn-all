import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * The GoDaddy API credential behind Tech > Security > Cloudflare: it reads the domains, their
 * DNS records and nameservers, and changes the nameservers. Managed from Tech > Environment
 * Variables like every other platform credential; exactly one is `isActive` at a time. GoDaddy
 * signs a call with the key and its secret together (`sso-key KEY:SECRET`).
 */
const godaddyConfigSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    apiKey: { type: String, required: true, trim: true },
    apiSecret: { type: String, required: true, trim: true },
    isActive: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

export type GodaddyConfigDocument = InferSchemaType<typeof godaddyConfigSchema>;

export const GodaddyConfigModel: Model<GodaddyConfigDocument> = model<GodaddyConfigDocument>(
  'GodaddyConfig',
  godaddyConfigSchema,
);
