import { PermissionsScreen } from '../components/permissions/PermissionsScreen';
import { useTrackerState } from '../hooks/useTrackerState';
import { capabilities } from '../tracker/platform';

/** The OS grants the tracker still needs before the app opens. */
export default function PermissionsRoute() {
  const state = useTrackerState();
  if (state === null) {
    return null;
  }
  return (
    <PermissionsScreen
      permissions={state.permissions}
      capabilities={capabilities}
      status={state.status}
      pendingSync={state.stats.pendingSync}
    />
  );
}

export { ScreenErrorBoundary as ErrorBoundary } from '../components/shell/ScreenErrorBoundary';
