import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/** The integrations whose calls are counted, as the GraphQL `IntegrationProvider` enum names them. */
export const INTEGRATION_PROVIDERS = [
  'OPENAI',
  'SMTP',
  'IMAGEKIT',
  'SLACK',
  'GITHUB',
  'PEXELS',
  'FIRECRAWL',
  'GOOGLE_MAPS',
  'STRIPE',
  'RAZORPAY',
  'PAYPAL',
  'PAYONEER',
  'GODADDY',
  'CLOUDFLARE',
  'SONARQUBE',
  'GMAIL',
  'MICROSOFT',
  'GOOGLE_SIGN_IN',
  'TWILIO',
  'MSG91',
  'VOBIZ',
  'SARVAM',
  'SOCIAL',
  'GOOGLE_CALENDAR',
  'EMAIL_VERIFIER',
] as const;

export type IntegrationProvider = (typeof INTEGRATION_PROVIDERS)[number];

/**
 * One day of one kind of call to one integration — `OPENAI` / `gpt-4o-mini` / `2026-10-24`.
 *
 * A counter, not a log: every call adds to its day's row with `$inc`, so a busy day costs one
 * document per kind, never one per call. Install-wide (a platform model) like the credentials
 * the calls are made with — Tech sees what the whole platform spent, not one company.
 */
const integrationUsageSchema = new Schema(
  {
    provider: { type: String, enum: INTEGRATION_PROVIDERS, required: true },
    /** What was called: the model for OpenAI, the API method for Slack, the kind of upload… */
    action: { type: String, required: true, trim: true, maxlength: 120 },
    /** The UTC day, `YYYY-MM-DD`. */
    day: { type: String, required: true },
    calls: { type: Number, default: 0, min: 0 },
    failures: { type: Number, default: 0, min: 0 },
    /** Tokens in and out, for the integrations that bill by token (OpenAI). */
    inputTokens: { type: Number, default: 0, min: 0 },
    outputTokens: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

integrationUsageSchema.index({ provider: 1, action: 1, day: 1 }, { unique: true });
integrationUsageSchema.index({ day: 1 });

export type IntegrationUsageDocument = InferSchemaType<typeof integrationUsageSchema>;

export const IntegrationUsageModel: Model<IntegrationUsageDocument> =
  model<IntegrationUsageDocument>('IntegrationUsage', integrationUsageSchema);
