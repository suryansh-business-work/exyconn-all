import { useCallback, useEffect, useRef, useState } from 'react';
import {
  TableBulkJobStatus,
  useStartTableBulkJobMutation,
  useTableBulkJobQuery,
  type TableBulkJobFieldsFragment,
  type TableBulkJobInput,
} from '@/graphql/generated';
import { portalLogger } from '@/logging/portalLogger';
import { queryData } from '@/utils/queryData';

/** How often a running job's progress is read. */
export const BULK_JOB_POLL_MS = 1_000;

export type BulkJob = TableBulkJobFieldsFragment;

export interface BulkJobControl {
  /** The job last started from this table, as last read. */
  job: BulkJob | null;
  /** True while that job is queued or working; the table stays usable throughout. */
  running: boolean;
  /** The last job as it ended (done or failed), for its report; null until one ends. */
  finished: BulkJob | null;
  /** Whether the toolbar shows the running job's progress (the person may dismiss it). */
  visible: boolean;
  dismiss: () => void;
  /** Queues a job on the server and starts following it; rejects when the server refuses. */
  start: (input: TableBulkJobInput) => Promise<void>;
}

const FINISHED: ReadonlySet<TableBulkJobStatus> = new Set([
  TableBulkJobStatus.Done,
  TableBulkJobStatus.Failed,
]);

/**
 * Starts a table bulk action as a server-side job and follows it: the job id comes straight
 * back, its progress is polled until it ends, and then `onFinished` hears the finished job (to
 * refresh the rows in place); {@link BulkJobStatus} shows the progress and reports the end.
 * Nothing here locks the table — the person can search, page and open rows meanwhile.
 */
export function useBulkJob(onFinished: (job: BulkJob) => void): BulkJobControl {
  const [startJob] = useStartTableBulkJobMutation();
  const [job, setJob] = useState<BulkJob | null>(null);
  const [finished, setFinished] = useState<BulkJob | null>(null);
  const [visible, setVisible] = useState(false);
  const running = job !== null && !FINISHED.has(job.status);
  const { data, error } = useTableBulkJobQuery({
    variables: { id: job?.id ?? '' },
    skip: !running,
    pollInterval: BULK_JOB_POLL_MS,
    fetchPolicy: 'network-only',
  });
  const onFinishedRef = useRef(onFinished);
  onFinishedRef.current = onFinished;

  // Each answer the poll brings is seen once; polling stops as soon as the job has ended, so
  // the end is handed over exactly once. A job the server no longer knows (expired, or another
  // account's) is simply no longer followed.
  const latest = data?.tableBulkJob;
  useEffect(() => {
    if (latest === undefined) {
      return;
    }
    setJob(latest);
    if (latest && FINISHED.has(latest.status)) {
      setFinished(latest);
      setVisible(false);
      onFinishedRef.current(latest);
    }
  }, [latest]);

  useEffect(() => {
    if (error) {
      portalLogger.error('Could not read the bulk job', error, { jobId: job?.id });
    }
  }, [error, job?.id]);

  const start = useCallback(
    async (input: TableBulkJobInput) => {
      const result = await startJob({ variables: { input } });
      setJob(queryData(result, 'Starting the bulk action').startTableBulkJob);
      setVisible(true);
    },
    [startJob],
  );
  const dismiss = useCallback(() => setVisible(false), []);

  return { job, running, finished, visible, dismiss, start };
}
