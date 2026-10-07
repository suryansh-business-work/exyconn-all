import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import {
  desktopNotificationsSupported,
  notifyDesktop,
  requestDesktopPermission,
} from '../../../../../src/pages/chat/alerts/desktopNotification';

vi.mock('@exyconn/shell/logging/portalLogger', () => ({ portalLogger: { warn: vi.fn() } }));

/** The browser's Notification API, recording what it shows. */
class FakeNotification {
  static permission: NotificationPermission = 'default';
  static answer: NotificationPermission = 'granted';
  static shown: FakeNotification[] = [];
  static readonly requestPermission = vi.fn(() => Promise.resolve(FakeNotification.answer));
  onclick: (() => void) | null = null;
  readonly close = vi.fn();

  constructor(
    readonly title: string,
    readonly options: NotificationOptions,
  ) {
    FakeNotification.shown.push(this);
  }
}

function installNotifications(permission: NotificationPermission) {
  FakeNotification.permission = permission;
  Object.defineProperty(globalThis, 'Notification', {
    value: FakeNotification,
    configurable: true,
    writable: true,
  });
}

function removeNotifications() {
  Reflect.deleteProperty(globalThis, 'Notification');
}

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state });
}

describe('desktop notifications', () => {
  beforeEach(() => {
    FakeNotification.shown = [];
    FakeNotification.requestPermission.mockClear();
    vi.mocked(portalLogger.warn).mockClear();
  });

  afterEach(() => {
    removeNotifications();
    Reflect.deleteProperty(document, 'visibilityState');
    vi.unstubAllGlobals();
  });

  it('knows whether the browser has notifications at all', () => {
    removeNotifications();
    expect(desktopNotificationsSupported()).toBe(false);
    installNotifications('default');
    expect(desktopNotificationsSupported()).toBe(true);
  });

  it('cannot get permission from a browser without notifications', async () => {
    removeNotifications();
    await expect(requestDesktopPermission()).resolves.toBe(false);
  });

  it('does not ask again once notifications are allowed', async () => {
    installNotifications('granted');
    await expect(requestDesktopPermission()).resolves.toBe(true);
    expect(FakeNotification.requestPermission).not.toHaveBeenCalled();
  });

  it('asks, and is allowed only when the person says yes', async () => {
    installNotifications('default');
    FakeNotification.answer = 'granted';
    await expect(requestDesktopPermission()).resolves.toBe(true);

    FakeNotification.answer = 'denied';
    await expect(requestDesktopPermission()).resolves.toBe(false);
    expect(FakeNotification.requestPermission).toHaveBeenCalledTimes(2);
  });

  it('shows a notification for a tab in the background, tagged by chat', () => {
    installNotifications('granted');
    setVisibility('hidden');
    notifyDesktop('New chat message from Asha', 'Hello', 's1', vi.fn());

    expect(FakeNotification.shown).toHaveLength(1);
    expect(FakeNotification.shown[0].title).toBe('New chat message from Asha');
    expect(FakeNotification.shown[0].options).toEqual({ body: 'Hello', tag: 's1' });
  });

  it('brings the tab forward and opens the chat when the notification is clicked', () => {
    installNotifications('granted');
    setVisibility('hidden');
    const focus = vi.fn();
    vi.stubGlobal('focus', focus);
    const onOpen = vi.fn();
    notifyDesktop('New chat message from Asha', 'Hello', 's1', onOpen);

    const [shown] = FakeNotification.shown;
    shown.onclick?.();

    expect(focus).toHaveBeenCalledTimes(1);
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(shown.close).toHaveBeenCalledTimes(1);
  });

  it('shows nothing on the visible tab, without permission or without support', () => {
    installNotifications('granted');
    setVisibility('visible');
    notifyDesktop('Title', 'Body', 's1', vi.fn());

    setVisibility('hidden');
    FakeNotification.permission = 'denied';
    notifyDesktop('Title', 'Body', 's1', vi.fn());

    removeNotifications();
    notifyDesktop('Title', 'Body', 's1', vi.fn());

    expect(FakeNotification.shown).toHaveLength(0);
  });

  it('logs instead of failing when the browser refuses to show one', () => {
    const refused = new TypeError('Illegal constructor');
    class RefusingNotification {
      static readonly permission = 'granted';
      constructor() {
        throw refused;
      }
    }
    Object.defineProperty(globalThis, 'Notification', {
      value: RefusingNotification,
      configurable: true,
      writable: true,
    });
    setVisibility('hidden');

    expect(() => notifyDesktop('Title', 'Body', 's1', vi.fn())).not.toThrow();
    expect(portalLogger.warn).toHaveBeenCalledWith(
      'Could not show a chat desktop notification',
      refused,
    );
  });
});
