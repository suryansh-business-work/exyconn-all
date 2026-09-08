import { useEffect } from 'react';
import {
  AiJobStatus,
  useGetAiJobQuery,
  type GetAiJobQuery,
} from '@exyconn/shell/graphql/generated';

/** How often an unfinished job re-reads itself while its dialog is open. */
const POLL_MS = 2_000;

export interface WatchedAiJob {
  job?: GetAiJobQuery['getAiJob'];
  loading: boolean;
  /** True while the worker still owes this job an answer. */
  waiting: boolean;
}

/**
 * One job, re-read until it settles.
 *
 * A run is queued rather than performed inside the request, so the result dialog can open
 * on a job with no answer yet. Polling stops the moment the row reaches SUCCEEDED or
 * FAILED — a dialog left open on a finished job should cost nothing.
 */
export function useAiJob(id: string): WatchedAiJob {
  const { data, loading, startPolling, stopPolling } = useGetAiJobQuery({
    variables: { id },
    fetchPolicy: 'network-only',
  });
  const job = data?.getAiJob;
  const waiting = job?.status === AiJobStatus.Queued || job?.status === AiJobStatus.Running || !job;

  useEffect(() => {
    if (!waiting) {
      stopPolling();
      return undefined;
    }
    startPolling(POLL_MS);
    return () => stopPolling();
  }, [waiting, startPolling, stopPolling]);

  return { job, loading, waiting };
}
