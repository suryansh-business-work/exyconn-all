import { useEffect, useState } from 'react';
import type { TrackerState } from '@shared/types';
import LoginScreen from './screens/LoginScreen';
import ConsentScreen from './screens/ConsentScreen';
import PermissionsScreen from './screens/PermissionsScreen';
import DashboardScreen from './screens/DashboardScreen';

/**
 * Thin router: subscribes to the tracker state and renders one screen per status.
 * `permissions.allGranted` is always true on Windows, so the permissions screen
 * only appears on macOS when a grant is still missing.
 */
export default function App(): JSX.Element {
  const [state, setState] = useState<TrackerState | null>(null);

  useEffect(() => {
    let active = true;
    const unsubscribe = window.tracker.onStateChanged((next) => {
      if (active) {
        setState(next);
      }
    });
    window.tracker
      .getState()
      .then((initial) => {
        if (active) {
          setState(initial);
        }
      })
      .catch((error: unknown) => {
        console.error('Failed to load tracker state', error);
      });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  if (state === null) {
    return <div className="app app--center">Loading…</div>;
  }
  if (state.status === 'signed-out') {
    return <LoginScreen />;
  }
  if (state.status === 'consent-required') {
    return <ConsentScreen />;
  }
  if (!state.permissions.allGranted) {
    return <PermissionsScreen permissions={state.permissions} />;
  }
  return <DashboardScreen state={state} />;
}
