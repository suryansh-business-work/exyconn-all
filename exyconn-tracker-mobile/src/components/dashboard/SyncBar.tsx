import { Spinner, XStack } from 'tamagui';
import { formatLastSync, syncMessage } from '@exyconn/tracker-core';
import type { LiveStats, TrackerSettings } from '@exyconn/tracker-core';
import { syncPendingText, syncPolicyText } from '../../lib/dashboard/sync-text';
import { useThemeColor } from '../../theme/useThemeColor';
import { Icon } from '../ui/Icon';
import { Notice } from '../ui/Notice';
import { Surface } from '../ui/Surface';
import { Body, Caption } from '../ui/Typography';

interface Props {
  stats: LiveStats;
  settings: TrackerSettings | null;
  /** The employee's chosen zone — "last synced" is a real instant, so it is shown in it. */
  timezone: string;
}

interface StatusIconProps {
  syncing: boolean;
  settled: boolean;
}

/** A spinner while an upload is in flight, else a cloud that is done or still has a queue. */
function SyncStatusIcon({ syncing, settled }: Readonly<StatusIconProps>) {
  const success = useThemeColor('success');
  const warning = useThemeColor('warning');
  if (syncing) {
    return <Spinner size="small" color={warning} accessibilityLabel="Uploading" />;
  }
  if (settled) {
    return <Icon name="cloud-check-outline" size={20} color={success} />;
  }
  return <Icon name="cloud-upload-outline" size={20} color={warning} />;
}

/**
 * Upload status. Read-only on purpose: there is no "Sync now" button.
 *
 * Uploading used to be switchable, with a manual button as the other path — which meant an
 * employee could work a full week with the toggle off and nothing uploaded, and nobody found
 * out until the timesheet was empty. Now it simply happens, on the workspace's cadence, and
 * this says when it last did and what is still queued.
 */
export function SyncBar({ stats, settings, timezone }: Readonly<Props>) {
  const settled = stats.pendingSync === 0 && !stats.syncing;
  const message = syncMessage(stats.lastSyncOutcome);

  return (
    <Surface gap="$2">
      <XStack gap="$3" alignItems="center">
        <SyncStatusIcon syncing={stats.syncing} settled={settled} />
        <Body flex={1} fontWeight="600" numberOfLines={1}>
          {syncPendingText(stats)}
        </Body>
      </XStack>
      <Caption>
        Last synced {formatLastSync(stats.lastSyncAt, timezone)} · {syncPolicyText(settings)}
      </Caption>
      {message !== null && !stats.syncing ? (
        <Notice severity={message.severity}>{message.text}</Notice>
      ) : null}
    </Surface>
  );
}
