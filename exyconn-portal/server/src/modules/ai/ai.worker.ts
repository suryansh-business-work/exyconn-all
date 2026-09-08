import { AiJobModel } from './ai.model';
import { executeAiJob } from './ai.service';
import { logger } from '../../utils/logger';

/** How often the process looks for a job somebody queued. */
const TICK_MS = 3_000;

/**
 * Runs the oldest queued job, if there is one. Reports whether it found work.
 *
 * One job at a time, on purpose: the queue exists so a slow completion stops blocking the
 * person who asked for it, not to fan a rate-limited API key out across a dozen parallel
 * requests. `findOneAndUpdate` claims the row in the same round trip that reads it, so two
 * ticks overlapping cannot both take the same job.
 */
export async function runNextAiJob(): Promise<boolean> {
  const job = await AiJobModel.findOneAndUpdate(
    { status: 'QUEUED', queuedAt: { $ne: null } },
    { $set: { status: 'RUNNING' } },
    { sort: { queuedAt: 1 }, new: true },
  );
  if (!job) {
    return false;
  }
  await executeAiJob(job);
  return true;
}

/**
 * Starts the loop that drains the AI queue.
 *
 * Nothing escapes a tick: a failed run is already recorded on its own row, and anything
 * left — a dropped database connection, say — is logged and the next tick tries again.
 * `.unref()` so the queue never holds the process open on shutdown.
 */
export function startAiWorker(): void {
  const tick = () => {
    runNextAiJob().catch((error: unknown) => logger.error(error, 'AI queue tick failed'));
  };
  tick();
  globalThis.setInterval(tick, TICK_MS).unref();
  logger.info('AI job worker started');
}
