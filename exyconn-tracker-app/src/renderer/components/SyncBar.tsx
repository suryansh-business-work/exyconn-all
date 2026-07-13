import type { TrackerSettings, LiveStats } from '@shared/types';
import { formatLastSync } from '../format';

interface Props {
  stats: LiveStats;
  settings: TrackerSettings | null;
  onSync: () => void;
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

/**
 * Upload status + the manual "Sync now" control. Screenshots and activity share one
 * durable queue, so a sync uploads both (screenshots go to ImageKit via the portal).
 */
export default function SyncBar({ stats, settings, onSync }: Readonly<Props>): JSX.Element {
  const pending = stats.pendingSync;
  const label = stats.syncing ? 'Syncing…' : 'Sync now';

  return (
    <div className="sync">
      <div className="sync__row">
        <div className="sync__info">
          <span className="sync__pending">
            {pending === 0 ? 'Everything uploaded' : `${pending.toLocaleString()} waiting to upload`}
          </span>
          <span className="sync__meta">Last synced {formatLastSync(stats.lastSyncAt)}</span>
        </div>
        <button
          className="btn btn--primary btn--sm"
          type="button"
          disabled={stats.syncing}
          onClick={onSync}
        >
          {label}
        </button>
      </div>

      <span className="sync__policy">{policyText(settings)}</span>

      {stats.lastSyncError ? (
        <span className="sync__error" role="alert">
          {stats.lastSyncError} — queued items are safe and will retry.
        </span>
      ) : null}
    </div>
  );
}
