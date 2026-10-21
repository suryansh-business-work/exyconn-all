/**
 * The service worker. Every listener is registered synchronously at the top level, as
 * Manifest V3 requires, so an event that wakes a suspended worker is never missed. No timers
 * outlive an event: reminders, heartbeats and finalization run on chrome.alarms.
 */
import { onHeartbeat, endSession, onFinalizeAlarm } from './meeting';
import { HEARTBEAT_ALARM } from './capture';
import {
  evaluateReminders,
  onNotificationButton,
  onNotificationClick,
  reminderTab,
} from './reminders';
import { onMessage } from './router';
import { logTo } from '../services/logger';
import { logger, registry } from './services';

/**
 * Keeps both token areas away from content scripts (session already is by default). A module
 * service worker cannot use top-level await, so the work is started here and its failure logged.
 */
function lockStorage(): void {
  Promise.all([
    chrome.storage.session.setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' }),
    chrome.storage.local.setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' }),
  ]).catch(report('Could not restrict extension storage'));
}

/** Logs a failure from a listener that has no one to answer. */
const report = (task: string): ((error: unknown) => void) => logTo(logger, task, 'error');

lockStorage();

chrome.runtime.onMessage.addListener(onMessage);

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === HEARTBEAT_ALARM) {
    onHeartbeat().catch(report('Heartbeat failed'));
    return;
  }
  if (alarm.name.startsWith('finalize:')) {
    const tabId = Number.parseInt(alarm.name.slice('finalize:'.length), 10);
    onFinalizeAlarm(tabId).catch(report('Finalize failed'));
    return;
  }
  const tabId = reminderTab(alarm.name);
  if (tabId !== null) {
    evaluateReminders(tabId).catch(report('Reminder failed'));
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  registry
    .get(tabId)
    .then((session) => (session === null ? undefined : endSession(tabId, true)))
    .catch(report('Could not close the meeting of a closed tab'));
});

chrome.notifications.onButtonClicked.addListener((id, buttonIndex) => {
  onNotificationButton(id, buttonIndex).catch(report('Reminder action failed'));
});

chrome.notifications.onClicked.addListener((id) => {
  onNotificationClick(id).catch(report('Could not open the meeting tab'));
});
