import { portalLogger } from '@exyconn/shell/logging/portalLogger';

/** Whether this browser can show desktop notifications at all. */
export const desktopNotificationsSupported = (): boolean => 'Notification' in globalThis;

/** Asks for permission; true once the person has allowed notifications for the portal. */
export async function requestDesktopPermission(): Promise<boolean> {
  if (!desktopNotificationsSupported()) {
    return false;
  }
  if (Notification.permission === 'granted') {
    return true;
  }
  return (await Notification.requestPermission()) === 'granted';
}

/**
 * Shows a desktop notification while the tab is in the background. A visible tab already shows
 * the message, so it gets none. Clicking it brings the tab forward and runs `onOpen`.
 */
export function notifyDesktop(title: string, body: string, tag: string, onOpen: () => void): void {
  if (
    !desktopNotificationsSupported() ||
    Notification.permission !== 'granted' ||
    document.visibilityState === 'visible'
  ) {
    return;
  }
  try {
    const notification = new Notification(title, { body, tag });
    notification.onclick = () => {
      globalThis.focus();
      onOpen();
      notification.close();
    };
  } catch (error) {
    portalLogger.warn('Could not show a chat desktop notification', error);
  }
}
