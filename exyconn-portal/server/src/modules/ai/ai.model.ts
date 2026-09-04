import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

export const AI_JOB_STATUSES = ['QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED'] as const;

/**
 * One prompt sent to OpenAI, and what came back.
 *
 * The status is the job's own lifecycle, never something the author types: a job is created
 * QUEUED and only `runAiJob` moves it on. The answer, the token usage and the failure reason
 * are kept on the row so a run can be read back long after it finished — the API keeps
 * nothing for us.
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
    /** Wall-clock time the request took, so a slow model is visible in the grid. */
    latencyMs: { type: Number, default: 0, min: 0 },
    ranAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export type AiJobDocument = InferSchemaType<typeof aiJobSchema>;
export const AiJobModel: Model<AiJobDocument> = model<AiJobDocument>('AiJob', aiJobSchema);
