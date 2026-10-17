import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * A web page read through Firecrawl (CRM > Tools > Website scraper), kept as markdown so it can
 * be handed to the AI later without scraping it again. The last AI answer is kept beside it.
 */
const webScrapeSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    title: { type: String, default: '', trim: true },
    markdown: { type: String, default: '' },
    charCount: { type: Number, required: true, default: 0 },
    createdById: { type: String, required: true },
    createdByName: { type: String, default: '' },
    aiInstruction: { type: String, default: '' },
    aiResponse: { type: String, default: '' },
    aiCostUsd: { type: Number, default: null },
    analyzedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export type WebScrapeDocument = InferSchemaType<typeof webScrapeSchema>;

export const WebScrapeModel: Model<WebScrapeDocument> = model<WebScrapeDocument>(
  'WebScrape',
  webScrapeSchema,
);
