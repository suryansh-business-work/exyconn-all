import type { ReactElement } from 'react';
import { Alert, LinearProgress, Stack, TRACKER_RADIUS, Typography } from '@exyconn/ui';
import { useT } from '@exyconn/i18n';
import CloudDoneOutlined from '@mui/icons-material/CloudDoneOutlined';
import CloudUploadOutlined from '@mui/icons-material/CloudUploadOutlined';
import type { LiveStats, TrackerSettings } from '@shared/types';
import { formatCount, formatLastSync, syncMessage } from '@exyconn/tracker-core';
import Surface from './Surface';
import { useAnnounce } from '../a11y/LiveAnnouncer';

interface Props {
  stats: LiveStats;
  settings: TrackerSettings | null;
  /** The employee's chosen zone — "last synced" is a real instant, so it is shown in it. */
  timezone: string;
}

type Translate = ReturnType<typeof useT>;

/** The upload cadence the portal has configured, in plain language. */
function policyText(settings: TrackerSettings | null, t: Translate): string {
  if (!settings) {
    return t('Sync policy unavailable');
  }
  const mins = settings.syncIntervalMinutes;
  if (mins === 1) {
    return t('Uploads automatically every {count} minute', { count: mins });
  }
  return t('Uploads automatically every {count} minutes', { count: mins });
}

function pendingText(stats: LiveStats, t: Translate): string {
  if (stats.syncing) {
    return t('Uploading…');
  }
  if (stats.pendingSync === 0) {
    return t('Everything uploaded');
  }
  return t('{count} waiting to upload', { count: formatCount(stats.pendingSync) });
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
  const t = useT();
  const settled = stats.pendingSync === 0 && !stats.syncing;
  const StatusIcon = settled ? CloudDoneOutlined : CloudUploadOutlined;
  const message = syncMessage(t, stats.lastSyncOutcome);
  // What the last upload came to, spoken once each time it changes.
  useAnnounce(message?.text, message?.severity === 'error' ? 'assertive' : 'polite');

  return (
    <Surface sx={{ p: 2 }}>
      <Stack
        direction="row"
        spacing={1.5}
        sx={{
          alignItems: 'center',
        }}
      >
        <StatusIcon fontSize="small" sx={{ color: settled ? 'success.main' : 'warning.main' }} />
        <Typography variant="subtitle2" component="p" noWrap sx={{ flex: 1, minWidth: 0 }}>
          {pendingText(stats, t)}
        </Typography>
      </Stack>

      <Typography
        variant="caption"
        sx={{
          color: 'text.secondary',
          display: 'block',
          mt: 0.75,
        }}
      >
        {t('Last synced {time}', { time: formatLastSync(stats.lastSyncAt, timezone) })} ·{' '}
        {policyText(settings, t)}
      </Typography>

      {stats.syncing ? <LinearProgress aria-label={t('Uploading…')} sx={{ mt: 1.5 }} /> : null}

      {message !== null && !stats.syncing ? (
        <Alert
          severity={message.severity}
          variant="outlined"
          sx={{ mt: 1.5, borderRadius: `${TRACKER_RADIUS}px` }}
        >
          {message.text}
        </Alert>
      ) : null}
    </Surface>
  );
}
