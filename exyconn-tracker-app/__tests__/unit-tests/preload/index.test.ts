import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { IPC } from '@shared/types';
import type { TrackerApi } from '../../../src/preload/index';

type Handler = (...args: unknown[]) => void;

const { exposed, ipcRenderer, supportsTransparency, realGetSystemVersion } = vi.hoisted(() => {
  const real = Object.getOwnPropertyDescriptor(process, 'getSystemVersion');
  // Electron's own process API; the preload reads it at load, and node has no such function.
  Object.defineProperty(process, 'getSystemVersion', {
    value: () => '10.0.22631',
    configurable: true,
  });
  return {
    realGetSystemVersion: real,
    exposed: new Map<string, unknown>(),
    ipcRenderer: {
      invoke: vi.fn((...args: unknown[]) => Promise.resolve(args)),
      on: vi.fn(),
      removeListener: vi.fn(),
      send: vi.fn(),
    },
    supportsTransparency: vi.fn(() => true),
  };
});

vi.mock('electron', () => ({
  contextBridge: { exposeInMainWorld: (key: string, api: unknown) => exposed.set(key, api) },
  ipcRenderer,
}));
vi.mock('@shared/transparency', () => ({ supportsTransparency }));

/** Built at runtime, so no credential-looking literal sits in the source. */
const SECRET = ['pass', String(Date.now())].join('-');

await import('../../../src/preload/index');
const api = exposed.get('tracker') as TrackerApi;

beforeEach(() => {
  ipcRenderer.invoke.mockClear();
  ipcRenderer.on.mockClear();
  ipcRenderer.removeListener.mockClear();
  ipcRenderer.send.mockClear();
});

afterAll(() => {
  if (realGetSystemVersion === undefined) {
    Reflect.deleteProperty(process, 'getSystemVersion');
  } else {
    Object.defineProperty(process, 'getSystemVersion', realGetSystemVersion);
  }
});

describe('the tracker bridge', () => {
  it('is exposed to the page as window.tracker, saying whether see-through is possible', () => {
    expect(api).toBeDefined();
    expect(api.transparencySupported).toBe(true);
    expect(supportsTransparency).toHaveBeenCalledWith(process.platform, '10.0.22631');
  });

  it.each([
    ['getState', [], IPC.getState],
    ['reportLogs', [{ entries: [] }], IPC.reportLogs],
    ['login', ['asha@example.com', SECRET, true], IPC.login],
    ['logout', [], IPC.logout],
    ['acceptConsent', ['Asha Rao'], IPC.acceptConsent],
    ['markAttendance', ['PRESENT', null], IPC.markAttendance],
    ['setProject', ['p1'], IPC.setProject],
    ['setTask', ['t1'], IPC.setTask],
    ['start', [], IPC.start],
    ['pause', [], IPC.pause],
    ['resume', [], IPC.resume],
    ['stop', [], IPC.stop],
    ['getReport', ['2026-09-01', '2026-09-30'], IPC.getReport],
    ['getDay', ['a', 'b'], IPC.getDay],
    ['getTotals', [], IPC.getTotals],
    ['setTimezone', ['Asia/Kolkata'], IPC.setTimezone],
    ['getTranslations', ['fr'], IPC.getTranslations],
    ['translateMissing', ['fr', ['Hello']], IPC.translateMissing],
    ['openScreenshots', [{ startISO: 'a', endISO: 'b' }], IPC.openScreenshots],
    ['getPermissions', [], IPC.getPermissions],
    ['requestPermission', ['camera'], IPC.requestPermission],
    ['setPreferences', [{ closeToTray: false }], IPC.setPreferences],
    ['getTasks', ['p1'], IPC.getTasks],
    ['getManualEntries', ['a', 'b'], IPC.getManualEntries],
    ['createManualEntry', [{ projectId: 'p1' }], IPC.createManualEntry],
    ['withdrawManualEntry', ['m1'], IPC.withdrawManualEntry],
    ['setPresence', ['LUNCH', 'back at two'], IPC.setPresence],
    ['getMessages', ['CHAT'], IPC.getMessages],
    ['sendMessage', ['hello'], IPC.sendMessage],
    ['markMessagesRead', ['CHAT'], IPC.markMessagesRead],
    ['saveReport', [{ fileName: 'r.csv', content: 'a' }], IPC.saveReport],
    ['getAppVersion', [], IPC.getAppVersion],
    ['getUpdate', [], IPC.getUpdate],
    ['checkForUpdate', [], IPC.checkForUpdate],
    ['downloadUpdate', [], IPC.downloadUpdate],
    ['installUpdate', [], IPC.installUpdate],
    ['minimizeWindow', [], IPC.minimizeWindow],
    ['toggleMaximizeWindow', [], IPC.toggleMaximizeWindow],
    ['closeWindow', [], IPC.closeWindow],
    ['openPrivacy', [], IPC.openPrivacy],
  ] as const)('%s invokes its channel with its arguments', async (name, args, channel) => {
    const command = api[name] as (...all: unknown[]) => Promise<unknown>;

    await expect(command(...args)).resolves.toEqual([channel, ...args]);
    expect(ipcRenderer.invoke).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['onUpdateChanged', IPC.updateChanged, { stage: 'ready' }],
    ['onWindowMaximized', IPC.windowMaximized, true],
    ['onStateChanged', IPC.stateChanged, { status: 'idle' }],
    ['onScreenshotCaptured', IPC.screenshotCaptured, { count: 1, silent: false }],
    ['onOpenCaptureDay', IPC.openCaptureDay, '2026-09-14T10:30:00.000Z'],
    ['onCaptureRequested', IPC.captureRequested, { id: 'r1' }],
    ['onCloseBlocked', IPC.closeBlocked, 3],
  ] as const)(
    '%s hands the payload on and unsubscribes the same handler',
    (name, channel, payload) => {
      const listener = vi.fn();
      const subscribe = api[name] as (fn: Handler) => () => void;

      const unsubscribe = subscribe(listener);
      const [registered, handler] = ipcRenderer.on.mock.calls[0] as unknown as [string, Handler];
      handler({ sender: 'main' }, payload);

      expect(registered).toBe(channel);
      expect(listener).toHaveBeenCalledWith(payload);

      unsubscribe();
      expect(ipcRenderer.removeListener).toHaveBeenCalledWith(channel, handler);
    },
  );

  it('tells the page the quit was released, with nothing attached', () => {
    const listener = vi.fn();

    const unsubscribe = api.onCloseReleased(listener);
    const [registered, handler] = ipcRenderer.on.mock.calls[0] as unknown as [string, Handler];
    handler({ sender: 'main' }, 'ignored');

    expect(registered).toBe(IPC.closeReleased);
    expect(listener).toHaveBeenCalledWith();
    unsubscribe();
    expect(ipcRenderer.removeListener).toHaveBeenCalledWith(IPC.closeReleased, handler);
  });

  it('sends a capture result back to main without waiting for an answer', () => {
    const result = { id: 'r1', image: null, error: 'no camera' };

    api.sendCaptureResult(result);

    expect(ipcRenderer.send).toHaveBeenCalledWith(IPC.captureResult, result);
  });
});
