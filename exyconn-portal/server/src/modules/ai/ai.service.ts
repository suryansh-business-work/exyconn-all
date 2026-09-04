import { AiJobModel } from './ai.model';
import { OpenAiConfigModel } from '../tech/openai-config.model';
import { openAiClient } from '../../utils/openai';
import { badRequest, notFound } from '../../utils/errors';
import { logger } from '../../utils/logger';

const NO_CONFIG =
  'No active OpenAI key. Add one in Tech › Environment Variables and mark it active.';

/**
 * The key every AI request goes out with. It lives in the database (Tech ›
 * Environment Variables), so a rotation is a portal edit rather than a redeploy —
 * which also means it can legitimately be missing, and that is worth saying plainly.
 */
async function activeConfig() {
  const config = await OpenAiConfigModel.findOne({ isActive: true }).lean();
  if (!config) badRequest(NO_CONFIG);
  return config;
}

/** The models this account may actually use, for the model picker. */
export async function listAiModels(): Promise<string[]> {
  const config = await activeConfig();
  return openAiClient.listModels(config.apiKey);
}

/** The model a new job starts on, so the form opens on something that works. */
export async function defaultAiModel(): Promise<string> {
  const config = await activeConfig();
  return config.defaultModel;
}

/**
 * Sends the job's prompt to OpenAI and records the outcome on the job itself.
 *
 * A failure is stored on the row rather than thrown: the run genuinely happened, and
 * "what did it say when it broke" is the question people come back to the job to ask.
 */
export async function runAiJob(id: string) {
  const job = await AiJobModel.findById(id);
  if (!job) notFound('AI job');
  if (job.status === 'RUNNING') badRequest('This job is already running.');

  const config = await activeConfig();
  job.status = 'RUNNING';
  await job.save();

  const startedAt = Date.now();
  try {
    const result = await openAiClient.complete({
      apiKey: config.apiKey,
      model: job.model,
      prompt: job.prompt,
    });
    job.status = 'SUCCEEDED';
    job.response = result.text;
    job.error = '';
    job.promptTokens = result.promptTokens;
    job.completionTokens = result.completionTokens;
    job.totalTokens = result.totalTokens;
  } catch (err) {
    logger.error({ err, jobId: id }, 'AI job failed');
    job.status = 'FAILED';
    job.response = '';
    job.error = err instanceof Error ? err.message : 'The run failed.';
  }

  job.latencyMs = Date.now() - startedAt;
  job.ranAt = new Date();
  await job.save();
  return job.toObject();
}
