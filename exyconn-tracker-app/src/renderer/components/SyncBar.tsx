import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CloudDoneOutlined from '@mui/icons-material/CloudDoneOutlined';
import CloudUploadOutlined from '@mui/icons-material/CloudUploadOutlined';
import SyncRounded from '@mui/icons-material/SyncRounded';
import type { LiveStats, SyncOutcome, TrackerSettings } from '@shared/types';
import { formatCount, formatLastSync } from '../format';
import { run } from '../run';
import { syncMessage } from '../sync-text';
import Surface from './Surface';

interface Props {
  stats: LiveStats;
  settings: TrackerSettings | null;
}

/** Describes the upload policy the portal has configured, in plain language. */
function policyText(settings: TrackerSettings | null): string {
  if (!settings) {
    return 'Sync policy unavailable';
  }
  if (!settings.autoSyncEnabled) {
    return 'Auto-sync is off — press Sync now to upload';
  }
  const mins = settings.syncIntervalMinutes;
  return `Auto-syncs every ${mins} minute${mins === 1 ? '' : 's'}`;
}

function pendingText(pending: number): string {
  if (pending === 0) {
    return 'Everything uploaded';
  }
  return `${formatCount(pending)} waiting to upload`;
}

/**
 * Upload status + the manual "Sync now" control. Screenshots and activity share one durable
 * queue, so a sync uploads both (screenshots go to ImageKit via the portal). Every press
 * reports what it did — including when it did nothing, and why.
 */
export default function SyncBar({ stats, settings }: Readonly<Props>): JSX.Element {
  const [pressed, setPressed] = useState<SyncOutcome | null>(null);
  const settled = stats.pendingSync === 0;
  const StatusIcon = settled ? CloudDoneOutlined : CloudUploadOutlined;

  // The press result wins: a null engine never reaches the pushed stats at all.
  const message = syncMessage(pressed ?? stats.lastSyncOutcome);

  async function sync(): Promise<void> {
    setPressed(null);
    setPressed(await window.tracker.syncNow());
  }

  return (
    <Surface sx={{ p: 2 }}>
      {/* Two lines, not one: at this window width the policy caption and the button collided. */}
      <Stack direction="row" spacing={1.5} alignItems="center">
        <StatusIcon fontSize="small" sx={{ color: settled ? 'success.main' : 'warning.main' }} />
        <Typography variant="subtitle2" noWrap sx={{ flex: 1, minWidth: 0 }}>
          {pendingText(stats.pendingSync)}
        </Typography>
        <Button
          variant="contained"
          size="small"
          sx={{ flexShrink: 0 }}
          startIcon={
            stats.syncing ? <CircularProgress size={16} color="inherit" /> : <SyncRounded />
          }
          disabled={stats.syncing}
          onClick={() => run(sync)}
        >
          {stats.syncing ? 'Syncing…' : 'Sync now'}
        </Button>
      </Stack>

      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.75 }}>
        Last synced {formatLastSync(stats.lastSyncAt)} · {policyText(settings)}
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
