import { portalLogger } from '@exyconn/shell/logging/portalLogger';

/** How this browser tells its user about a new visitor message. Chosen per person, per browser. */
export interface ChatAlertPrefs {
  sound: boolean;
  desktop: boolean;
  animate: boolean;
}

const STORAGE_KEY = 'exyconn.website.chat-alerts';

export const DEFAULT_CHAT_ALERT_PREFS: ChatAlertPrefs = {
  sound: true,
  desktop: false,
  animate: true,
};

/** The saved choices, or the defaults when nothing was saved or storage is blocked. */
export function readChatAlertPrefs(): ChatAlertPrefs {
  try {
    const raw = globalThis.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_CHAT_ALERT_PREFS;
    }
    const saved = JSON.parse(raw) as Partial<ChatAlertPrefs>;
    return {
      sound: saved.sound ?? DEFAULT_CHAT_ALERT_PREFS.sound,
      desktop: saved.desktop ?? DEFAULT_CHAT_ALERT_PREFS.desktop,
      animate: saved.animate ?? DEFAULT_CHAT_ALERT_PREFS.animate,
    };
  } catch (error) {
    portalLogger.warn('Could not read the chat alert preferences', error);
    return DEFAULT_CHAT_ALERT_PREFS;
  }
}

export function saveChatAlertPrefs(prefs: ChatAlertPrefs): void {
  try {
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch (error) {
    portalLogger.warn('Could not save the chat alert preferences', error);
  }
}
