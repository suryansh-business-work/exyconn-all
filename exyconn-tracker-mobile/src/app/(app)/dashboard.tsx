import { DashboardScreen } from '../../components/dashboard/DashboardScreen';
import { useTrackerState } from '../../hooks/useTrackerState';

/** The tracker's home: today's progress, the controls, and the session and all-time numbers. */
export default function Dashboard() {
  const state = useTrackerState();
  if (state === null) {
    return null;
  }
  return <DashboardScreen state={state} />;
}

export { ScreenErrorBoundary as ErrorBoundary } from '../../components/shell/ScreenErrorBoundary';
