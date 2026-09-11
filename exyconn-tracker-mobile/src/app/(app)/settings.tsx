import { SettingsScreen } from '../../components/settings/SettingsScreen';
import { useTrackerState } from '../../hooks/useTrackerState';

/** Settings & About — what this phone does, what the workspace configured, and signing out. */
export default function SettingsRoute() {
  const state = useTrackerState();
  if (state === null) {
    return null;
  }
  return <SettingsScreen state={state} />;
}

export { ScreenErrorBoundary as ErrorBoundary } from '../../components/shell/ScreenErrorBoundary';
