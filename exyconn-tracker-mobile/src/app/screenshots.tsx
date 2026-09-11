import { useLocalSearchParams } from 'expo-router';
import { ScreenshotsScreen } from '../components/screenshots/ScreenshotsScreen';
import { useTrackerState } from '../hooks/useTrackerState';

/**
 * The screenshot gallery, as a modal. Opened by My Report's day panel (`start`/`end`) or by a
 * capture notification (`capturedAt`, which is uploaded first so the gallery can show it).
 */
export default function ScreenshotsRoute() {
  const state = useTrackerState();
  const params = useLocalSearchParams<{ capturedAt?: string; start?: string; end?: string }>();
  if (state === null) {
    return null;
  }
  return <ScreenshotsScreen params={params} timezone={state.timezone} />;
}
