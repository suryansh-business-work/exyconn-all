import { AiJobModel, type AiJobDocument } from './ai.model';
import { costOfRun } from './ai.pricing';
import { assertWithinAiBudget } from './ai.budget';
import { OpenAiConfigModel } from '../tech/openai-config.model';
import { openAiClient } from '../../utils/openai';
import { badRequest, notFound } from '../../utils/errors';
import { logger } from '../../utils/logger';
import type { HydratedDocument } from 'mongoose';

const NO_CONFIG =
  'No active OpenAI key. Add one in Tech › Environment Variables and mark it active.';

/** Who started a run, as the token reports them. */
export interface AiActor {
  id: string;
  name: string;
}

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
 * Sends one job's prompt to OpenAI and records the outcome on the job itself.
 *
 * A failure is stored on the row rather than thrown: the run genuinely happened, and
 * "what did it say when it broke" is the question people come back to the job to ask.
 * That also matters more now the caller is the background worker, which has nobody to
 * throw at.
 */
export async function executeAiJob(job: HydratedDocument<AiJobDocument>) {
  const config = await activeConfig();
  job.status = 'RUNNING';
  job.queuedAt = null;
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
    job.costUsd = await costOfRun(job.model, result);
  } catch (err) {
    logger.error({ err, jobId: String(job._id) }, 'AI job failed');
    job.status = 'FAILED';
    job.response = '';
    job.error = err instanceof Error ? err.message : 'The run failed.';
  }

  job.latencyMs = Date.now() - startedAt;
  job.ranAt = new Date();
  await job.save();
  return job.toObject();
}

/** Runs one job start to finish, in the caller's own request. */
export async function runAiJobNow(id: string) {
  const job = await AiJobModel.findById(id);
  if (!job) notFound('AI job');
  return executeAiJob(job);
}

/**
 * Puts a job in the queue for the worker to pick up, and answers immediately.
 *
 * The key and the budget are checked here rather than in the worker: a missing key or an
 * exhausted cap is the caller's problem to see now, not a FAILED row they find later.
 */
export async function enqueueAiJob(id: string, actor: AiActor) {
  const job = await AiJobModel.findById(id);
  if (!job) notFound('AI job');
  if (job.status === 'QUEUED' && job.queuedAt) {
    badRequest('This job is already waiting to run.');
  }
  if (job.status === 'RUNNING') {
    badRequest('This job is already running.');
  }
  await activeConfig();
  await assertWithinAiBudget(actor.id);

  job.status = 'QUEUED';
  job.queuedAt = new Date();
  job.error = '';
  job.response = '';
  job.createdById = actor.id;
  job.createdByName = actor.name;
  await job.save();
  return job.toObject();
}
