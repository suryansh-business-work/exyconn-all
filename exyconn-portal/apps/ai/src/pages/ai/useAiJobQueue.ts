import { useEffect, useRef } from 'react';
import { useAiJobsInFlightQuery, type AiJobsInFlightQuery } from '@exyconn/shell/graphql/generated';

/** How often the grid re-reads while something is still in the queue. */
const POLL_MS = 3_000;

type InFlightJob = AiJobsInFlightQuery['listAiJobs'][number];

/**
 * A job is only really in the queue once somebody has run it: every job is *created*
 * QUEUED, so status alone would have the page polling forever over a draft nobody has
 * submitted. `queuedAt` is what the worker itself looks at.
 */
function isInFlight(job: InFlightJob): boolean {
  return job.status === 'RUNNING' || (job.status === 'QUEUED' && Boolean(job.queuedAt));
}

export interface AiJobQueue {
  /** How many jobs are waiting or running right now. */
  inFlight: number;
  /** Call after queuing a run, so polling starts without waiting for the next tick. */
  refresh: () => Promise<unknown>;
}

/**
 * Keeps the jobs grid current while the worker is busy.
 *
 * Runs are asynchronous now, so a row is QUEUED when the mutation returns and settles some
 * seconds later with nothing on screen to say so. This polls a tiny query while anything
 * is in flight and reloads the grid on each answer, then stops — a page with nothing
 * running makes no requests at all.
 */
export function useAiJobQueue(reload: () => void): AiJobQueue {
  const { data, refetch, startPolling, stopPolling } = useAiJobsInFlightQuery({
    fetchPolicy: 'network-only',
  });
  const inFlight = (data?.listAiJobs ?? []).filter(isInFlight).length;
  // The grid fetches its own first page, so the first answer must not trigger a reload.
  const seen = useRef(false);

  useEffect(() => {
    if (inFlight === 0) {
      stopPolling();
      return undefined;
    }
    startPolling(POLL_MS);
    return () => stopPolling();
  }, [inFlight, startPolling, stopPolling]);

  useEffect(() => {
    if (!data) {
      return;
    }
    if (seen.current) {
      reload();
    }
    seen.current = true;
  }, [data, reload]);

  return { inFlight, refresh: refetch };
}
