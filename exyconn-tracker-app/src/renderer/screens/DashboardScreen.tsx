import type { TrackerState, TrackerStatus } from '@shared/types';
import StatTile from '../components/StatTile';
import SyncBar from '../components/SyncBar';
import { formatClock } from '../format';

interface PillInfo {
  label: string;
  className: string;
}

const PILL: Record<TrackerStatus, PillInfo> = {
  'signed-out': { label: 'Signed out', className: 'pill pill--idle' },
  'consent-required': { label: 'Consent required', className: 'pill pill--idle' },
  idle: { label: 'Not tracking', className: 'pill pill--idle' },
  tracking: { label: 'Tracking…', className: 'pill pill--live' },
  paused: { label: 'Paused', className: 'pill pill--paused' },
};

/** Fire a tracker command and log (never swallow) any failure. */
function run(action: () => Promise<void>): void {
  action().catch((cause: unknown) => {
    console.error('Tracker action failed', cause);
  });
}

interface Props {
  state: TrackerState;
}

/** Main tracking UI: identity, status, controls and live stats. */
export default function DashboardScreen({ state }: Readonly<Props>): JSX.Element {
  const { user, stats, status, settings } = state;
  const pill = PILL[status];
  const isIdle = status === 'idle';
  const isTracking = status === 'tracking';
  const isPaused = status === 'paused';

  return (
    <div className="app screen screen--scroll">
      <header className="dash__header">
        <div className="dash__user">
          <span className="dash__name">{user?.name ?? 'Signed in'}</span>
          <span className="dash__email">{user?.email ?? ''}</span>
        </div>
        <button
          className="btn btn--ghost btn--sm"
          type="button"
          onClick={() => run(() => window.tracker.logout())}
        >
          Sign out
        </button>
      </header>

      <div className={pill.className}>
        <span className="pill__dot" />
        <span>{pill.label}</span>
      </div>

      <div className="controls">
        <button
          className="btn btn--primary"
          type="button"
          disabled={!isIdle}
          onClick={() => run(() => window.tracker.start())}
        >
          Start
        </button>
        <button
          className="btn btn--secondary"
          type="button"
          disabled={!isTracking}
          onClick={() => run(() => window.tracker.pause())}
        >
          Pause
        </button>
        <button
          className="btn btn--secondary"
          type="button"
          disabled={!isPaused}
          onClick={() => run(() => window.tracker.resume())}
        >
          Resume
        </button>
        <button
          className="btn btn--danger"
          type="button"
          disabled={!isTracking && !isPaused}
          onClick={() => run(() => window.tracker.stop())}
        >
          Stop
        </button>
      </div>

      <SyncBar
        stats={stats}
        settings={settings}
        onSync={() => run(() => window.tracker.syncNow())}
      />

      <div className="tiles">
        <StatTile label="Worked" value={formatClock(stats.sessionActiveMs)} />
        <StatTile label="Idle" value={formatClock(stats.sessionIdleMs)} />
        <StatTile label="Key presses" value={stats.keyCount.toLocaleString()} />
        <StatTile label="Mouse clicks" value={stats.mouseCount.toLocaleString()} />
        <StatTile label="Current app" value={stats.currentApp || '—'} />
        <StatTile label="Screenshots" value={stats.screenshotCount.toLocaleString()} />
      </div>

      <button
        className="link"
        type="button"
        onClick={() => run(() => window.tracker.openPrivacy())}
      >
        View my data in the portal
      </button>
    </div>
  );
}
