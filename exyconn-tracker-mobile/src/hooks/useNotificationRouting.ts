import * as Notifications from 'expo-notifications';
import { useRouter, type Href } from 'expo-router';
import { useEffect } from 'react';

/**
 * Opens what a tapped alert points at — the dashboard after a pause, Messages for a message.
 *
 * Runs in the signed-in layout, which only renders once the navigator exists. It used to run in
 * the root layout, where a tap that cold-started the app pushed before the navigator was mounted
 * — "Attempted to navigate before mounting the Root Layout" — and that closed the app. The last
 * response covers both that cold-start tap and a tap while the app runs; it is cleared once
 * handled so a later remount does not replay it.
 */
export function useNotificationRouting(): void {
  const router = useRouter();
  const response = Notifications.useLastNotificationResponse();

  useEffect(() => {
    if (!response) {
      return;
    }
    Notifications.clearLastNotificationResponse();
    const url: unknown = response.notification.request.content.data?.url;
    if (typeof url === 'string') {
      router.push(url as Href);
    }
  }, [response, router]);
}
