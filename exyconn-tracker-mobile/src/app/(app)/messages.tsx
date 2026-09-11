import { MessagesScreen } from '../../components/messages/MessagesScreen';
import { useTrackerState } from '../../hooks/useTrackerState';

/** Messages: the chat thread with whoever administers tracking, and the announcements. */
export default function MessagesRoute() {
  const state = useTrackerState();
  if (state === null) {
    return null;
  }
  return <MessagesScreen timezone={state.timezone} />;
}

export { ScreenErrorBoundary as ErrorBoundary } from '../../components/shell/ScreenErrorBoundary';
