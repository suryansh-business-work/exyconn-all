import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { INTEGRATION_PROVIDERS } from './usage.model';

/** How long one call's row is kept. The daily counters (usage.model) keep the long view. */
export const CALL_LOG_RETENTION_DAYS = 180;

/**
 * One call to an integration made with an Environment Variables credential: what was called,
 * whether it worked, how long it took, its tokens and (where a price is known) its cost, and
 * who on which portal caused it. Install-wide, like the credentials; never holds a secret or a
 * request body.
 */
const integrationCallSchema = new Schema(
  {
    provider: { type: String, enum: INTEGRATION_PROVIDERS, required: true },
    action: { type: String, required: true, trim: true, maxlength: 120 },
    ok: { type: Boolean, required: true },
    durationMs: { type: Number, default: 0, min: 0 },
    inputTokens: { type: Number, default: 0, min: 0 },
    outputTokens: { type: Number, default: 0, min: 0 },
    /** USD, from the price table (Tech > AI pricing); null where no price is kept. */
    costUsd: { type: Number, default: null },
    /** The company the call was made for; '' for platform work. */
    companyId: { type: String, default: '' },
    actorId: { type: String, default: '' },
    actorEmail: { type: String, default: '' },
    /** The portal or site (Origin) that caused it, or "Background job". */
    source: { type: String, default: '' },
    path: { type: String, default: '' },
    /** A short reason for a failure; never a response body. */
    error: { type: String, default: '', maxlength: 300 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

integrationCallSchema.index({ createdAt: -1 });
integrationCallSchema.index({ provider: 1, createdAt: -1 });
integrationCallSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: CALL_LOG_RETENTION_DAYS * 24 * 60 * 60, name: 'call_log_retention' },
);

export type IntegrationCallDocument = InferSchemaType<typeof integrationCallSchema>;
export const IntegrationCallModel: Model<IntegrationCallDocument> = model<IntegrationCallDocument>(
  'IntegrationCall',
  integrationCallSchema,
);
