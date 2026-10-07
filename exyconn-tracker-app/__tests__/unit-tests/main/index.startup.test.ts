import { afterEach, describe, expect, it, vi } from 'vitest';
import { IPC } from '@shared/types';
import type { CloseGuardHooks } from '../../../src/main/close-guard';

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

const { appEvents, controller, electron, launch, mainWindow, mocks, store, tray, updater } = h;

type PermissionHandler = (
  contents: unknown,
  permission: string,
  callback: (granted: boolean) => void,
) => void;

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('startup', () => {
  it('reports errors and guards navigation before anything else, then builds the app', async () => {
    await launch();

    expect(mocks.installMainCrashHandlers).toHaveBeenCalled();
    expect(mocks.installNavigationGuards).toHaveBeenCalled();
    expect(electron.app.setAppUserModelId).toHaveBeenCalledWith('com.exyconn.timetracker');
    expect(mocks.registerCaptureBridge).toHaveBeenCalled();
    expect(mocks.registerWindowControls).toHaveBeenCalled();
    expect(controller.restore).toHaveBeenCalled();
    expect(tray.args[0]).toBeTypeOf('function');
  });

  it('grants the pages the camera and nothing else', async () => {
    await launch();
    const [[handler]] = electron.session.defaultSession.setPermissionRequestHandler.mock
      .calls as unknown as [[PermissionHandler]];
    const answers = ['media', 'geolocation', 'notifications'].map((permission) => {
      let granted: boolean | undefined;
      handler({}, permission, (value) => {
        granted = value;
      });
      return granted;
    });

    expect(answers).toEqual([true, false, false]);
  });

  it('builds a frameless, sandboxed window on the chosen ground and loads the built page', async () => {
    vi.stubEnv('ELECTRON_RENDERER_URL', '');
    await launch();
    const win = mainWindow();

    expect(mocks.wantsTransparency).toHaveBeenCalledWith(false);
    expect(win.options).toMatchObject({
      width: 420,
      height: 680,
      frame: false,
      show: false,
      backgroundColor: '#101010',
    });
    expect(win.options.webPreferences).toMatchObject({
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false,
    });
    expect(String(win.loadFile.mock.calls[0])).toMatch(/renderer[\\/]index\.html/);
    expect(mocks.applyWindowChrome).toHaveBeenCalledWith(win);

    win.events.get('ready-to-show')?.();
    expect(win.show).toHaveBeenCalled();
  });

  it('loads the dev server in development', async () => {
    vi.stubEnv('ELECTRON_RENDERER_URL', 'http://localhost:4005');
    await launch({ packaged: false });

    expect(mainWindow().loadURL).toHaveBeenCalledWith('http://localhost:4005');
    expect(updater.start).not.toHaveBeenCalled();
  });

  it('starts the updater only in a packaged app, with the employee’s choice', async () => {
    await launch();

    expect(updater.start).toHaveBeenCalledWith('https://portal.test/graphql', true);
  });

  it('publishes the restored state to the logger, the window and the tray', async () => {
    await launch();
    const state = h.world.state;

    expect(mocks.setLogUser).toHaveBeenCalledWith(state.user);
    expect(mainWindow().webContents.send).toHaveBeenCalledWith(IPC.stateChanged, state);
    expect(tray.update).toHaveBeenCalledWith(state);
  });

  it('quits at once when another copy is already running', async () => {
    await launch({ lock: false });

    expect(electron.app.quit).toHaveBeenCalled();
    expect(h.FakeWindow.all).toHaveLength(0);
  });

  it('brings the window forward when a second copy is launched', async () => {
    await launch();

    appEvents.get('second-instance')?.();

    expect(mainWindow().show).toHaveBeenCalled();
    expect(mainWindow().focus).toHaveBeenCalled();
  });
});

describe('closing', () => {
  it('hides to the tray by default and keeps running', async () => {
    await launch();
    const event = { preventDefault: vi.fn() };

    mainWindow().events.get('close')?.(event);
    appEvents.get('window-all-closed')?.();

    expect(event.preventDefault).toHaveBeenCalled();
    expect(mainWindow().hide).toHaveBeenCalled();
    expect(electron.app.quit).not.toHaveBeenCalled();
  });

  it('quits for real when close-to-tray is off and nothing is uploading', async () => {
    await launch();
    store.preferences.closeToTray = false;
    const event = { preventDefault: vi.fn() };

    mainWindow().events.get('close')?.(event);
    appEvents.get('window-all-closed')?.();

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(electron.app.quit).toHaveBeenCalled();
  });

  it('holds the close while an upload is going up, and lets the guard quit later', async () => {
    await launch();
    store.preferences.closeToTray = false;
    mocks.holdForUpload.mockReturnValueOnce(true);
    const event = { preventDefault: vi.fn() };

    mainWindow().events.get('close')?.(event);
    appEvents.get('window-all-closed')?.();

    expect(event.preventDefault).toHaveBeenCalled();
    expect(electron.app.quit).not.toHaveBeenCalled();

    const [[, hooks]] = mocks.holdForUpload.mock.calls as unknown as [[unknown, CloseGuardHooks]];
    h.world.state.stats.syncing = true;
    h.world.state.stats.pendingSync = 4;
    expect(hooks.isSyncing()).toBe(true);
    expect(hooks.pending()).toBe(4);
    hooks.release();
    expect(electron.app.quit).toHaveBeenCalled();
  });

  it('closes straight through once the app is quitting', async () => {
    await launch();
    appEvents.get('before-quit')?.();
    const event = { preventDefault: vi.fn() };

    mainWindow().events.get('close')?.(event);
    appEvents.get('window-all-closed')?.();

    expect(mainWindow().hide).not.toHaveBeenCalled();
    expect(electron.app.quit).toHaveBeenCalled();
  });
});
