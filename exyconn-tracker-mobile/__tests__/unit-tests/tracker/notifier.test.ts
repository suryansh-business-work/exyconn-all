import { describe, expect, it, vi } from 'vitest';
import {
  configureNotifications,
  mobileNotifier,
  notifyCaptureStopped,
} from '../../../src/tracker/notifier';
import * as Notifications from '../mocks/expo-notifications';
import { Platform } from '../mocks/react-native/apis';

interface Scheduled {
  content: { title: string; body: string; data: { url: string } };
  trigger: { channelId: string } | null;
}

function lastScheduled(): Scheduled {
  const call = Notifications.scheduleNotificationAsync.mock.calls.at(-1);
  return call?.[0] as Scheduled;
}

describe('configureNotifications', () => {
  it('shows alerts as banners with sound even while the app is open', async () => {
    await configureNotifications();
    const [{ handleNotification }] = Notifications.setNotificationHandler.mock.calls[0] as [
      { handleNotification: () => Promise<unknown> },
    ];
    await expect(handleNotification()).resolves.toEqual({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    });
    expect(Notifications.setNotificationChannelAsync).not.toHaveBeenCalled();
  });

  it('creates the high-importance alert channel on Android', async () => {
    Platform.OS = 'android';
    await configureNotifications();
    expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith('tracker_alerts', {
      name: 'Tracker alerts',
      importance: Notifications.AndroidImportance.HIGH,
    });
  });
});

describe('mobileNotifier', () => {
  it('says why tracking paused and sends a tap to the dashboard', () => {
    mobileNotifier.autoPaused(10);
    expect(lastScheduled()).toEqual({
      content: {
        title: 'Exyconn Tracker — paused',
        body: 'Your phone was not in use for 10 minutes. Tap Resume when you are back.',
        data: { url: '/dashboard' },
      },
      trigger: null,
    });
  });

  it('posts to the alert channel on Android', () => {
    Platform.OS = 'android';
    mobileNotifier.autoStopped('6:00 PM');
    expect(lastScheduled()).toMatchObject({
      content: {
        title: 'Exyconn Tracker — stopped for the day',
        body: 'Your tracking window ended at 6:00 PM. Time from now on is not being logged.',
        data: { url: '/dashboard' },
      },
      trigger: { channelId: 'tracker_alerts' },
    });
  });

  it('counts new messages without putting their words on the lock screen', () => {
    mobileNotifier.messages(1);
    expect(lastScheduled().content.body).toBe(
      'You have a new message from your workspace. Open Messages to read it.',
    );
    mobileNotifier.messages(4);
    expect(lastScheduled().content).toEqual({
      title: 'Exyconn Tracker — message',
      body: 'You have 4 new messages from your workspace. Open Messages to read it.',
      data: { url: '/messages' },
    });
  });

  it('passes a workspace notice through and opens Messages', () => {
    mobileNotifier.notice('Policy updated', 'Read the new disclosure.');
    expect(lastScheduled().content).toEqual({
      title: 'Exyconn Tracker — Policy updated',
      body: 'Read the new disclosure.',
      data: { url: '/messages' },
    });
  });

  it('logs, and never throws, when the OS refuses the notification', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const refusal = new Error('notifications blocked');
    Notifications.scheduleNotificationAsync.mockRejectedValueOnce(refusal);
    expect(() => mobileNotifier.notice('Hello', 'World')).not.toThrow();
    await vi.waitFor(() => expect(error).toHaveBeenCalledWith('Notification failed', refusal));
    error.mockRestore();
  });
});

describe('notifyCaptureStopped', () => {
  it('explains that screen sharing ended and how to carry on', () => {
    notifyCaptureStopped();
    expect(lastScheduled().content).toEqual({
      title: 'Exyconn Tracker — paused',
      body: 'Screen sharing was stopped, so tracking paused. Tap Resume and allow screen capture to carry on.',
      data: { url: '/dashboard' },
    });
  });
});
