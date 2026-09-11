import { OffComputerScreen } from '../../components/off-computer/OffComputerScreen';
import { useTrackerState } from '../../hooks/useTrackerState';

/** Off-computer time: claim hours the tracker could not measure, and see where each stands. */
export default function OffComputerRoute() {
  const state = useTrackerState();
  if (state === null) {
    return null;
  }
  return <OffComputerScreen projects={state.projects} timezone={state.timezone} />;
}
