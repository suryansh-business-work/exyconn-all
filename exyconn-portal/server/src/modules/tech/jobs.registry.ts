import { readJobRuns, type JobKey } from '../../utils/jobHeartbeat';

/**
 * This file imports nothing from any module, deliberately.
 *
 * Every loop registers itself here at import time, so anything this file reached for would
 * be a cycle: the module would be importing the registry while the registry was importing the
 * module. The per-company fan-out therefore lives with the resolver that runs a job, not here.
 */

/**
 * A background loop, and a way to make it take one pass now.
 *
 * Every loop in this server is idempotent by construction — a claim stamp, a dedupe key, a
 * "last run" period — because two processes may tick at the same moment. That is what makes
 * a Run now button safe: it is the same pass the timer takes, not a second implementation,
 * so pressing it twice does what the timer doing two ticks would do, which is nothing the
 * second time.
 */
export interface BackgroundJob {
  key: JobKey;
  label: string;
  /** What the loop does in one line, for somebody deciding whether to press the button. */
  description: string;
  /**
   * One pass, for ONE company — the runner wraps it in the same per-organization fan-out the
   * timer uses. Returns nothing: what happened is reported through the heartbeat, exactly as
   * it is on a timed tick.
   */
  runOnce: () => Promise<unknown>;
}

const jobs: BackgroundJob[] = [];

/** Registers a loop. Called from the module that owns it, at import time. */
export function registerBackgroundJob(job: BackgroundJob): void {
  if (jobs.some((existing) => existing.key === job.key)) {
    throw new Error(`Two background jobs are registered as "${job.key}"`);
  }
  jobs.push(job);
}

export function backgroundJobs(): readonly BackgroundJob[] {
  return jobs;
}

/** Drops every registration — used by tests that register their own. */
export function clearBackgroundJobs(): void {
  jobs.length = 0;
}

/** One job, with whatever its last tick reported. */
export function describeBackgroundJobs() {
  const runs = readJobRuns();
  return jobs.map((job) => {
    const run = runs.get(job.key);
    return {
      key: job.key,
      label: job.label,
      description: job.description,
      lastRunAt: run?.at ?? null,
      lastRunSummary: run?.summary ?? '',
    };
  });
}

/** The job registered under a key, or undefined. The caller decides how to run it. */
export function findBackgroundJob(key: string): BackgroundJob | undefined {
  return jobs.find((candidate) => candidate.key === key);
}
