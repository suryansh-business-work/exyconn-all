import type { ReactElement } from 'react';
import { Alert, LinearProgress, Stack, Typography } from '@exyconn/ui';
import CloudDoneOutlined from '@mui/icons-material/CloudDoneOutlined';
import CloudUploadOutlined from '@mui/icons-material/CloudUploadOutlined';
import type { LiveStats, TrackerSettings } from '@shared/types';
import { formatCount } from '../format';
import { formatLastSync } from '../time';
import { syncMessage } from '../sync-text';
import Surface from './Surface';

interface Props {
  stats: LiveStats;
  settings: TrackerSettings | null;
  /** The employee's chosen zone — "last synced" is a real instant, so it is shown in it. */
  timezone: string;
}

/** The upload cadence the portal has configured, in plain language. */
function policyText(settings: TrackerSettings | null): string {
  if (!settings) {
    return 'Sync policy unavailable';
  }
  const mins = settings.syncIntervalMinutes;
  return `Uploads automatically every ${mins} minute${mins === 1 ? '' : 's'}`;
}

function pendingText(stats: LiveStats): string {
  if (stats.syncing) {
    return 'Uploading…';
  }
  if (stats.pendingSync === 0) {
    return 'Everything uploaded';
  }
  return `${formatCount(stats.pendingSync)} waiting to upload`;
}

/**
 * Upload status. Read-only on purpose: there is no "Sync now" button any more.
 *
 * Uploading used to be switchable, with a manual button as the other path — which meant an
 * employee could work a full week with the toggle off and nothing uploaded, and nobody found
 * out until the timesheet was empty. Now it simply happens, on the workspace's cadence, and
 * this says when it last did and what is still queued.
 */
export default function SyncBar({ stats, settings, timezone }: Readonly<Props>): ReactElement {
  const settled = stats.pendingSync === 0 && !stats.syncing;
  const StatusIcon = settled ? CloudDoneOutlined : CloudUploadOutlined;
  const message = syncMessage(stats.lastSyncOutcome);

  return (
    <Surface sx={{ p: 2 }}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <StatusIcon fontSize="small" sx={{ color: settled ? 'success.main' : 'warning.main' }} />
        <Typography variant="subtitle2" noWrap sx={{ flex: 1, minWidth: 0 }}>
          {pendingText(stats)}
        </Typography>
      </Stack>

      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.75 }}>
        Last synced {formatLastSync(stats.lastSyncAt, timezone)} · {policyText(settings)}
      </Typography>

      {stats.syncing ? <LinearProgress sx={{ mt: 1.5 }} /> : null}

      {message !== null && !stats.syncing ? (
        <Alert severity={message.severity} variant="outlined" sx={{ mt: 1.5, borderRadius: '4px' }}>
          {message.text}
        </Alert>
      ) : null}
    </Surface>
  );
}
