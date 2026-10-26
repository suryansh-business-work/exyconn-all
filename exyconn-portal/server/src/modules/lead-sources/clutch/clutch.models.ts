import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/** Which engine a Clutch search ran on. */
export const CLUTCH_ENGINES = ['MCP', 'APIFY'] as const;
export const CLUTCH_RUN_STATUSES = ['RUNNING', 'SUCCEEDED', 'FAILED'] as const;

/** The default Apify actor: ScrapeAI's Clutch.co Scraper. Any actor with its input works. */
export const DEFAULT_CLUTCH_ACTOR = 'scrapeai/clutch-co-scraper';

/**
 * A company's Apify account for Lead generators: the API token (sealed, utils/secretBox) and
 * the Clutch actor to run. One per company; without it, Clutch searches use Clutch's own MCP.
 */
const leadSourceSettingsSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: 'default' },
    apifyToken: { type: String, default: '', select: false },
    apifyTokenHint: { type: String, default: '' },
    clutchActorId: { type: String, default: DEFAULT_CLUTCH_ACTOR, trim: true },
    updatedByName: { type: String, default: '' },
  },
  { timestamps: true },
);

/**
 * One Clutch search and everything it found, kept so the results can be read, filtered and
 * filed into the CRM later without paying for the search again.
 */
const clutchRunSchema = new Schema(
  {
    engine: { type: String, enum: CLUTCH_ENGINES, required: true },
    status: { type: String, enum: CLUTCH_RUN_STATUSES, required: true, default: 'RUNNING' },
    keyword: { type: String, default: '', trim: true },
    location: { type: String, default: '', trim: true },
    industry: { type: String, default: '', trim: true },
    profileUrls: { type: [String], default: [] },
    includeDetails: { type: Boolean, default: false },
    includeReviews: { type: Boolean, default: false },
    includePortfolio: { type: Boolean, default: false },
    maxItems: { type: Number, default: 20 },
    /** ClutchCompany[] (clutch.types.ts), stored as found. */
    companies: { type: [Schema.Types.Mixed], default: [] },
    companyCount: { type: Number, default: 0 },
    /** Keys of the companies already filed into the CRM from this run. */
    filedKeys: { type: [String], default: [] },
    error: { type: String, default: '' },
    notes: { type: [String], default: [] },
    startedById: { type: String, default: '' },
    startedByName: { type: String, default: '' },
    finishedAt: { type: Date, default: null },
  },
  { timestamps: true },
);
clutchRunSchema.index({ createdAt: -1 });

export type LeadSourceSettingsDocument = InferSchemaType<typeof leadSourceSettingsSchema>;
export type ClutchRunDocument = InferSchemaType<typeof clutchRunSchema>;

export const LeadSourceSettingsModel: Model<LeadSourceSettingsDocument> =
  model<LeadSourceSettingsDocument>('LeadSourceSettings', leadSourceSettingsSchema);
export const ClutchRunModel: Model<ClutchRunDocument> = model<ClutchRunDocument>(
  'ClutchRun',
  clutchRunSchema,
);
