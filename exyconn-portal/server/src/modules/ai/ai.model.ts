import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

export const AI_JOB_STATUSES = ['QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED'] as const;

/**
 * One prompt sent to OpenAI, and what came back.
 *
 * The status is the job's own lifecycle, never something the author types: a job is created
 * QUEUED and only the AI worker moves it on. The answer, the token usage, the money it
 * cost and the failure reason are kept on the row so a run can be read back long after it
 * finished — the API keeps nothing for us.
 *
 * Who ran it is taken from the caller's token, never from the request body: attribution
 * that the client can set is attribution nobody can bill against.
 */
const aiJobSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    prompt: { type: String, required: true, trim: true },
    status: { type: String, enum: AI_JOB_STATUSES, required: true, default: 'QUEUED' },
    /** The prompt-library entry this job was started from, when it was. */
    promptId: { type: String, default: '', trim: true },
    /** What the model answered. Empty until the job succeeds. */
    response: { type: String, default: '' },
    /** Why the run failed, in the words the API gave. Empty unless the status is FAILED. */
    error: { type: String, default: '' },
    promptTokens: { type: Number, default: 0, min: 0 },
    completionTokens: { type: Number, default: 0, min: 0 },
    totalTokens: { type: Number, default: 0, min: 0 },
    /**
     * What the run cost, from the model's price row at the moment it finished. Zero when
     * no price is on file — see `ai.pricing.ts` for why that is not a guess.
     */
    costUsd: { type: Number, default: 0, min: 0 },
    /**
     * When the job was actually handed to the worker. A job is created QUEUED but not yet
     * submitted, so this — not the status — is what stops the worker running every draft
     * the moment somebody saves one.
     */
    queuedAt: { type: Date, default: null },
    /** Wall-clock time the request took, so a slow model is visible in the grid. */
    latencyMs: { type: Number, default: 0, min: 0 },
    ranAt: { type: Date, default: null },
    /** Who started it, resolved from the token on the request. */
    createdById: { type: String, default: '', trim: true },
    createdByName: { type: String, default: '', trim: true },
  },
  { timestamps: true },
);

export type AiJobDocument = InferSchemaType<typeof aiJobSchema>;
export const AiJobModel: Model<AiJobDocument> = model<AiJobDocument>('AiJob', aiJobSchema);
