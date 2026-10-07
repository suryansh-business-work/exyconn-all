import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { IPC, type TrackerSettings } from '@shared/types';

const h = await vi.hoisted(() => import('./index-harness'));

vi.mock('electron', () => h.electron);
vi.mock('../../../src/main/controller', () => ({ TrackerController: h.TrackerController }));
vi.mock('../../../src/main/tray', () => ({ TrackerTray: h.TrackerTray }));
vi.mock('../../../src/main/updater', () => ({ AppUpdater: h.AppUpdater }));
vi.mock('../../../src/main/store', () => ({ secureStore: () => h.store }));
vi.mock('../../../src/main/portal-client', () => ({
  PORTAL_GRAPHQL_URL: 'https://portal.test/graphql',
}));
vi.mock('../../../src/main/notifier', () => h.mocks);
vi.mock('../../../src/main/screenshots-window', () => h.mocks);
vi.mock('../../../src/main/capture-bridge', () => h.mocks);
vi.mock('../../../src/main/window-chrome', () => h.mocks);
vi.mock('../../../src/main/window-material', () => h.mocks);
vi.mock('../../../src/main/close-guard', () => h.mocks);
vi.mock('../../../src/main/report-file', () => h.mocks);
vi.mock('../../../src/main/crash-handlers', () => h.mocks);
vi.mock('../../../src/main/logger', () => h.mocks);
vi.mock('../../../src/main/web-security', () => h.mocks);

const { controller, electron, launch, mainWindow, mocks, store, tray, updater } = h;

type Notice = { image?: string; silent: boolean; onOpen: () => void };
type TrayActions = Record<'start' | 'pause' | 'resume' | 'stop' | 'quit', () => void>;

const REPORT = {
  capture: { count: 1, capturedAt: '2026-09-14T10:30:00.000Z' },
  stats: { sessionActiveMs: 1 },
  preview: 'cHJldmlldw==',
};

const onCapture = () => controller.args[1] as (report: typeof REPORT) => void;
const lastNotice = () => mocks.notifyScreenshotCaptured.mock.calls.at(-1)?.[2] as unknown as Notice;
const trayActions = () => tray.args[1] as TrayActions;

let consoleError: MockInstance;

beforeEach(() => {
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  consoleError.mockRestore();
});

describe('a capture', () => {
  it('sounds the shutter in the main window and notifies with the preview', async () => {
    await launch();

    onCapture()(REPORT);

    expect(mainWindow().webContents.send).toHaveBeenCalledWith(IPC.screenshotCaptured, {
      ...REPORT.capture,
      silent: false,
    });
    expect(mocks.notifyScreenshotCaptured).toHaveBeenCalledWith(REPORT.capture, REPORT.stats, {
      image: REPORT.preview,
      silent: false,
      onOpen: expect.any(Function),
    });
  });

  it('is silent when the workspace or this install has muted it', async () => {
    await launch();
    h.world.state = {
      ...h.idleState(),
      settings: { captureSoundEnabled: false } as TrackerSettings,
    };
    onCapture()(REPORT);
    expect(lastNotice().silent).toBe(true);

    h.world.state = { ...h.idleState(), settings: null };
    onCapture()(REPORT);
    expect(lastNotice().silent).toBe(false);

    store.preferences.muteCaptureSound = true;
    onCapture()(REPORT);
    expect(lastNotice().silent).toBe(true);
  });

  it('opens the shot’s day from the notification and syncs so the shot is there', async () => {
    await launch();
    onCapture()(REPORT);

    lastNotice().onOpen();

    expect(mainWindow().webContents.send).toHaveBeenCalledWith(
      IPC.openCaptureDay,
      REPORT.capture.capturedAt,
    );
    expect(controller.syncNow).toHaveBeenCalled();
  });

  it('logs a sync that fails after a notification click', async () => {
    await launch();
    const failure = new Error('offline');
    controller.syncNow.mockRejectedValueOnce(failure);
    onCapture()(REPORT);

    lastNotice().onOpen();
    await h.flush();

    expect(consoleError).toHaveBeenCalledWith('Sync after a capture notification failed', failure);
  });
});

describe('automatic updates', () => {
  it('tells the window where the update is', async () => {
    await launch();

    updater.onChange({ stage: 'downloading', percent: 40 });

    expect(mainWindow().webContents.send).toHaveBeenCalledWith(IPC.updateChanged, {
      stage: 'downloading',
      percent: 40,
    });
  });

  it('installs a downloaded version only between sessions and uploads', async () => {
    await launch();
    updater.installsAutomatically = true;

    for (const status of ['tracking', 'paused'] as const) {
      h.world.state = { ...h.idleState(), status };
      updater.onChange({ stage: 'ready' });
    }
    const uploading = h.idleState();
    uploading.stats.syncing = true;
    h.world.state = uploading;
    updater.onChange({ stage: 'ready' });
    expect(updater.install).not.toHaveBeenCalled();

    h.world.state = h.idleState();
    (controller.args[0] as (state: unknown) => void)(h.world.state);
    expect(updater.install).toHaveBeenCalledTimes(1);
  });

  it('waits for the controller before installing anything', async () => {
    await launch({ ready: false });
    updater.installsAutomatically = true;

    updater.onChange({ stage: 'ready' });
    expect(updater.install).not.toHaveBeenCalled();

    h.env.ready.open();
    await h.flush();
    expect(updater.install).toHaveBeenCalled();
  });
});

describe('the tray', () => {
  it('shows the current window and drives the controller', async () => {
    await launch();
    const actions = trayActions();

    expect((tray.args[0] as () => unknown)()).toBe(mainWindow());
    actions.start();
    actions.pause();
    actions.resume();
    actions.stop();

    expect(controller.start).toHaveBeenCalled();
    expect(controller.pause).toHaveBeenCalled();
    expect(controller.resume).toHaveBeenCalled();
    expect(controller.stop).toHaveBeenCalled();
  });

  it('logs a start the controller refused', async () => {
    await launch();
    const refusal = new Error('Mark your attendance first.');
    controller.start.mockRejectedValueOnce(refusal);

    trayActions().start();
    await h.flush();

    expect(consoleError).toHaveBeenCalledWith('Tray start refused', refusal);
  });

  it('quits, unless an upload is still going up', async () => {
    await launch();
    mocks.holdForUpload.mockReturnValueOnce(true);

    trayActions().quit();
    expect(electron.app.quit).not.toHaveBeenCalled();

    trayActions().quit();
    expect(electron.app.quit).toHaveBeenCalled();
  });
});
