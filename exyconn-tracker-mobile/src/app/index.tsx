import { Redirect } from 'expo-router';
import { useTrackerState } from '../hooks/useTrackerState';

/** Sends the app to the one screen its status allows — the same routing the guards enforce. */
export default function Index() {
  const state = useTrackerState();
  if (state === null || state.status === 'signed-out') {
    return <Redirect href="/login" />;
  }
  if (state.status === 'consent-required') {
    return <Redirect href="/consent" />;
  }
  if (!state.permissions.allGranted) {
    return <Redirect href="/permissions" />;
  }
  return <Redirect href="/dashboard" />;
}

export { ScreenErrorBoundary as ErrorBoundary } from '../components/shell/ScreenErrorBoundary';
