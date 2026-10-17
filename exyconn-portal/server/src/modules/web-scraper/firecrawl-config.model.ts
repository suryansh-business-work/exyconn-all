import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * The install's Firecrawl account (https://firecrawl.dev), managed in Tech > Environment
 * Variables > Firecrawl. `baseUrl` is the hosted API by default, or a self-hosted Firecrawl.
 * The API key is write-only and never leaves this server. One config is active at a time.
 */
const firecrawlConfigSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    baseUrl: { type: String, required: true, trim: true, default: 'https://api.firecrawl.dev' },
    /** Write-only. */
    apiKey: { type: String, default: '', trim: true },
    isActive: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

export type FirecrawlConfigDocument = InferSchemaType<typeof firecrawlConfigSchema>;

export const FirecrawlConfigModel: Model<FirecrawlConfigDocument> = model<FirecrawlConfigDocument>(
  'FirecrawlConfig',
  firecrawlConfigSchema,
);
