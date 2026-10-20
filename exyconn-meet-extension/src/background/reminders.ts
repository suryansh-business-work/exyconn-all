import {
  applyReminderAction,
  evaluateReminder,
  resolveIntervalMinutes,
  type ReminderAction,
  type ReminderSettings,
} from '../utils/reminders';
import { getOrg, tr } from './org';
import { prefsStore, registry } from './services';
import { publish } from './state';

export const reminderAlarm = (tabId: number): string => `reminder:${tabId}`;
const notificationId = (tabId: number): string => `reminder:${tabId}`;

/** The tab a reminder alarm or notification belongs to, or null for any other id. */
export function reminderTab(id: string): number | null {
  if (!id.startsWith('reminder:')) {
    return null;
  }
  const tabId = Number.parseInt(id.slice('reminder:'.length), 10);
  return Number.isNaN(tabId) ? null : tabId;
}

async function reminderSettings(): Promise<ReminderSettings> {
  const [org, prefs] = await Promise.all([getOrg(), prefsStore.read()]);
  return {
    enabled: org !== null && org.enabled && org.remindersEnabled,
    intervalMinutes: resolveIntervalMinutes(
      org?.reminderIntervalMinutes ?? 0,
      prefs.reminderInterval,
    ),
    maxPerMeeting: org?.maxRemindersPerMeeting ?? 0,
    snoozeMinutes: prefs.snoozeMinutes,
  };
}

async function schedule(tabId: number, nextAt: number | null): Promise<void> {
  if (nextAt === null) {
    await chrome.alarms.clear(reminderAlarm(tabId));
  } else {
    await chrome.alarms.create(reminderAlarm(tabId), { when: nextAt });
  }
}

async function notify(tabId: number): Promise<void> {
  await chrome.notifications.create(notificationId(tabId), {
    type: 'basic',
    iconUrl: chrome.runtime.getURL('icons/icon-128.png'),
    title: await tr('Exyconn Meeting Assistant'),
    message: await tr(
      'Meeting transcription is off. Enable transcription to generate meeting notes and action items.',
    ),
    buttons: [{ title: await tr('Remind later') }, { title: await tr('Snooze') }],
    priority: 1,
  });
}

/** Re-evaluates the tab's reminder: shows one when due, and (re)schedules the next. */
export async function evaluateReminders(tabId: number): Promise<void> {
  const settings = await reminderSettings();
  const now = Date.now();
  let show = false;
  const session = await registry.update(tabId, (s) => {
    const tick = evaluateReminder(
      s.reminder,
      settings,
      { meetingState: s.meetingState, transcriptionState: s.transcriptionState },
      now,
    );
    show = tick.show;
    return { ...s, reminder: tick.state };
  });
  if (session === null) {
    return;
  }
  await schedule(tabId, session.reminder.nextAt);
  if (!session.reminder.bannerVisible) {
    await chrome.notifications.clear(notificationId(tabId));
  }
  if (show && (await prefsStore.read()).desktopNotifications) {
    await notify(tabId);
  }
  await publish(tabId);
}

/** Remind later / Snooze / Dismiss, from the in-meeting banner or the notification. */
export async function applyReminderChoice(tabId: number, action: ReminderAction): Promise<void> {
  const settings = await reminderSettings();
  const session = await registry.update(tabId, (s) => ({
    ...s,
    reminder: applyReminderAction(s.reminder, action, settings, Date.now()),
  }));
  if (session === null) {
    return;
  }
  await chrome.notifications.clear(notificationId(tabId));
  await schedule(tabId, session.reminder.nextAt);
  await publish(tabId);
}

/** The notification's two buttons: Remind later, Snooze. */
export async function onNotificationButton(id: string, buttonIndex: number): Promise<void> {
  const tabId = reminderTab(id);
  if (tabId !== null) {
    await applyReminderChoice(tabId, buttonIndex === 0 ? 'LATER' : 'SNOOZE');
  }
}

/** Clicking the notification brings the call's tab to the front. */
export async function onNotificationClick(id: string): Promise<void> {
  const tabId = reminderTab(id);
  if (tabId === null) {
    return;
  }
  const tab = await chrome.tabs.update(tabId, { active: true });
  if (tab?.windowId !== undefined) {
    await chrome.windows.update(tab.windowId, { focused: true });
  }
  await chrome.notifications.clear(id);
}

export async function clearReminder(tabId: number): Promise<void> {
  await chrome.alarms.clear(reminderAlarm(tabId));
  await chrome.notifications.clear(notificationId(tabId));
}
