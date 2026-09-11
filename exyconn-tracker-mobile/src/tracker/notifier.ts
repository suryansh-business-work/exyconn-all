import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { TrackerNotifier } from '@exyconn/tracker-core';

/** The Android channel every tracker alert other than a capture goes to. */
const ALERT_CHANNEL = 'tracker_alerts';

/** Where tapping an alert takes the employee — an expo-router path. */
type AlertTarget = '/dashboard' | '/messages';

/** Shows alerts while the app is open too; a pause nobody sees is a pause nobody resumes. */
export async function configureNotifications(): Promise<void> {
  Notifications.setNotificationHandler({
    handleNotification: () =>
      Promise.resolve({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
  });
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ALERT_CHANNEL, {
      name: 'Tracker alerts',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
}

/** Best-effort, like the desktop's: a muted notification centre must never break tracking. */
function alert(title: string, body: string, target: AlertTarget): void {
  Notifications.scheduleNotificationAsync({
    content: { title: `Exyconn Tracker — ${title}`, body, data: { url: target } },
    trigger: Platform.OS === 'android' ? { channelId: ALERT_CHANNEL } : null,
  }).catch((error: unknown) => console.error('Notification failed', error));
}

/**
 * The notifications the shared controller raises, in the phone's words. Each one says why the
 * tracker did something the employee did not ask for, and what one tap does about it.
 */
export const mobileNotifier: TrackerNotifier = {
  autoPaused: (idleMinutes) =>
    alert(
      'paused',
      `Your phone was not in use for ${idleMinutes} minutes. Tap Resume when you are back.`,
      '/dashboard',
    ),
  autoStopped: (stopLabel) =>
    alert(
      'stopped for the day',
      `Your tracking window ended at ${stopLabel}. Time from now on is not being logged.`,
      '/dashboard',
    ),
  // The message itself is deliberately left out: an administrator's words belong in the app,
  // not on a lock screen anyone nearby can read.
  messages: (count) => {
    const what = count === 1 ? 'a new message' : `${count} new messages`;
    alert(
      'message',
      `You have ${what} from your workspace. Open Messages to read it.`,
      '/messages',
    );
  },
  notice: (title, body) => alert(title, body, '/messages'),
};

/** Raised when Android's screen-capture session ends mid-session and tracking pauses with it. */
export function notifyCaptureStopped(): void {
  alert(
    'paused',
    'Screen sharing was stopped, so tracking paused. Tap Resume and allow screen capture to carry on.',
    '/dashboard',
  );
}
