import { useEffect } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import { useFormatters, useT } from '@exyconn/i18n';
import { Box, IconButton, LinearProgress, Tooltip, Typography } from '@/components/ui';
import { useNotify } from '@/components/feedback/NotificationProvider';
import { TableBulkJobStatus } from '@/graphql/generated';
import { BULK_COPY } from './tableBulkCopy';
import type { BulkJob, BulkJobControl } from './useBulkJob';

/** The most the toolbar's progress bar is ever wide, so it never pushes the search box aside. */
const PROGRESS_WIDTH = 120;

type Notify = ReturnType<typeof useNotify>;

/** The toast once a job ends: every row through, how many failed and why, or why it stopped. */
function reportFinished(notify: Notify, job: BulkJob): void {
  const [first] = job.failures;
  if (job.status === TableBulkJobStatus.Failed) {
    notify(job.error ?? 'The bulk action failed', 'error');
  } else if (first) {
    notify('{done} done, {failed} failed: {reason}', 'error', {
      done: job.succeeded,
      failed: job.failedCount,
      reason: first.message,
    });
  } else {
    notify(BULK_COPY[job.action].done, 'success', { count: job.succeeded });
  }
}

/** Reports each job once, as it ends. */
function useFinishedReport({ finished }: BulkJobControl): void {
  const notify = useNotify();
  useEffect(() => {
    if (finished) {
      reportFinished(notify, finished);
    }
  }, [finished, notify]);
}

/**
 * The toolbar's small "Deleting 340 of 1,240…" while a bulk job runs, with a bar and a way to
 * dismiss it. It is only a view of the job: dismissing it hides the line, not the work, and it
 * still reports the counts in a toast once the job is done.
 */
export function BulkJobStatus({ control }: Readonly<{ control: BulkJobControl }>) {
  const t = useT();
  const { formatNumber } = useFormatters();
  useFinishedReport(control);
  const { job } = control;
  if (!job || !control.running || !control.visible) {
    return null;
  }
  const percent = job.total > 0 ? Math.round((job.processed / job.total) * 100) : 0;
  const label = t(BULK_COPY[job.action].progress, {
    done: formatNumber(job.processed),
    total: formatNumber(job.total),
  });
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Typography variant="body2" role="status" aria-live="polite">
        {label}
      </Typography>
      <LinearProgress
        variant="determinate"
        value={percent}
        aria-label={label}
        sx={{ width: PROGRESS_WIDTH }}
      />
      <Tooltip title={t('Hide progress')}>
        <IconButton size="small" onClick={control.dismiss} aria-label={t('Hide progress')}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
