import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * The Cloudflare API credential behind Tech > Security > Cloudflare. The token needs Zone:Read,
 * Zone:Edit and DNS:Edit; the account id is where a domain's zone is created when it is first
 * moved over. Exactly one is `isActive` at a time.
 */
const cloudflareConfigSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    apiToken: { type: String, required: true, trim: true },
    accountId: { type: String, required: true, trim: true },
    isActive: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

export type CloudflareConfigDocument = InferSchemaType<typeof cloudflareConfigSchema>;

export const CloudflareConfigModel: Model<CloudflareConfigDocument> =
  model<CloudflareConfigDocument>('CloudflareConfig', cloudflareConfigSchema);
