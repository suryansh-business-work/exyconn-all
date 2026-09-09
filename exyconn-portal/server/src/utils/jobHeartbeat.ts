/**
 * When each background loop last ticked, and what it did.
 *
 * In-memory on purpose: this answers "is the loop alive in *this* process", which a
 * database row cannot — a persisted timestamp survives the crash that stopped the loop
 * and would report a dead scheduler as healthy. Anything that must outlive a restart
 * (the payroll period already sent, the digest date already mailed) is stored by the
 * service that owns it and read alongside these values on the health screen.
 */

/** The keys the health screen knows how to label. */
export const JOB_KEYS = {
  statusMonitor: 'statusMonitor',
  payrollDispatch: 'payrollDispatch',
  trackerRetention: 'trackerRetention',
  trackerDigest: 'trackerDigest',
  recurringInvoices: 'recurringInvoices',
} as const;

export type JobKey = (typeof JOB_KEYS)[keyof typeof JOB_KEYS];

export interface JobRun {
  at: Date;
  summary: string;
}

const runs = new Map<string, JobRun>();

/** Records that a loop just completed a tick. Called from the tick itself. */
export function recordJobRun(key: JobKey, summary: string): void {
  runs.set(key, { at: new Date(), summary });
}

/** What every loop last reported, for the health screen. */
export function readJobRuns(): Map<string, JobRun> {
  return new Map(runs);
}

/** Drops every recorded run — used by tests that assert on an empty registry. */
export function clearJobRuns(): void {
  runs.clear();
}
