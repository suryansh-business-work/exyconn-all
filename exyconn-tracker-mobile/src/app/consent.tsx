import { ConsentScreen } from '../components/consent/ConsentScreen';
import { useTrackerState } from '../hooks/useTrackerState';
import { capabilities } from '../tracker/platform';

/** The consent gate: the workspace's disclosure, and the employee's agreement or signature. */
export default function ConsentRoute() {
  const state = useTrackerState();
  if (state === null) {
    return null;
  }
  return (
    <ConsentScreen
      settings={state.settings}
      policy={state.consentPolicy}
      capabilities={capabilities}
    />
  );
}
