import { useState } from 'react';
import type { PermissionState } from '@shared/types';

type PermissionKind = 'screenRecording' | 'accessibility';

interface PermissionRow {
  kind: PermissionKind;
  title: string;
  reason: string;
}

const PERMISSION_ROWS: readonly PermissionRow[] = [
  {
    kind: 'screenRecording',
    title: 'Screen Recording',
    reason: 'Lets the app capture periodic screenshots and read the active window title.',
  },
  {
    kind: 'accessibility',
    title: 'Accessibility',
    reason: 'Lets the app count keyboard and mouse activity — how often, never what you type.',
  },
];

interface Props {
  permissions: PermissionState;
}

/** macOS-only screen prompting for the TCC grants the tracker still needs. */
export default function PermissionsScreen({ permissions }: Readonly<Props>): JSX.Element {
  const [busy, setBusy] = useState(false);
  const missing = PERMISSION_ROWS.filter((row) => !permissions[row.kind]);

  async function grant(kind: PermissionKind): Promise<void> {
    setBusy(true);
    try {
      await window.tracker.requestPermission(kind);
    } catch (cause: unknown) {
      console.error('Failed to request permission', cause);
    } finally {
      setBusy(false);
    }
  }

  async function recheck(): Promise<void> {
    setBusy(true);
    try {
      await window.tracker.getPermissions();
    } catch (cause: unknown) {
      console.error('Failed to re-check permissions', cause);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app screen">
      <header className="brand">
        <span className="brand__dot" />
        <h1 className="brand__title">Exyconn Tracker</h1>
      </header>

      <div className="card">
        <h2 className="card__heading">Grant permissions</h2>
        <p className="body">
          macOS needs your permission before the tracker can work. Grant each item below, then
          re-check.
        </p>

        <ul className="perm-list">
          {missing.map((row) => (
            <li key={row.kind} className="perm">
              <div className="perm__text">
                <span className="perm__title">{row.title}</span>
                <span className="perm__reason">{row.reason}</span>
              </div>
              <button
                className="btn btn--primary btn--sm"
                type="button"
                onClick={() => grant(row.kind)}
                disabled={busy}
              >
                Grant
              </button>
            </li>
          ))}
        </ul>

        <button className="btn btn--ghost" type="button" onClick={recheck} disabled={busy}>
          Re-check
        </button>
        <p className="hint">Some features will not work until these are granted.</p>
      </div>
    </div>
  );
}
