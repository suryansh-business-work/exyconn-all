import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IPC } from '@shared/types';

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

const { controller, electron, invoke, launch, mainWindow, mocks, updater } = h;

/** Built at runtime, so no credential-looking literal sits in the source. */
const SECRET = ['pass', String(Date.now())].join('-');
const FROM = '2026-09-01T00:00:00.000Z';
const TO = '2026-10-01T00:00:00.000Z';

beforeEach(async () => {
  await launch();
});

describe('controller commands over IPC', () => {
  it('answers getState with the controller’s state', () => {
    expect(invoke(IPC.getState)).toBe(h.world.state);
  });

  it.each([
    [IPC.login, ['asha@example.com', SECRET, true], 'login'],
    [IPC.acceptConsent, ['Asha Rao'], 'acceptConsent'],
    [IPC.markAttendance, ['PRESENT', null], 'markAttendance'],
    [IPC.setProject, ['p1'], 'setProject'],
    [IPC.setTask, ['t1'], 'setTask'],
    [IPC.start, [], 'start'],
    [IPC.pause, [], 'pause'],
    [IPC.resume, [], 'resume'],
    [IPC.stop, [], 'stop'],
    [IPC.getReport, [FROM, TO], 'getReport'],
    [IPC.getDay, [FROM, TO], 'getDay'],
    [IPC.getTotals, [], 'getTotals'],
    [IPC.setTimezone, ['Asia/Kolkata'], 'setTimezone'],
    [IPC.getTranslations, ['fr'], 'getTranslations'],
    [IPC.translateMissing, ['fr', ['Hello']], 'translateMissing'],
    [IPC.getPermissions, [], 'refreshPermissions'],
    [IPC.requestPermission, ['camera'], 'requestPermission'],
    [IPC.getTasks, ['p1'], 'getTasks'],
    [IPC.getManualEntries, [FROM, TO], 'getManualEntries'],
    [IPC.createManualEntry, [{ projectId: 'p1' }], 'createManualEntry'],
    [IPC.withdrawManualEntry, ['m1'], 'withdrawManualEntry'],
    [IPC.setPresence, ['LUNCH', 'back at two'], 'setPresence'],
    [IPC.getMessages, ['CHAT'], 'getMessages'],
    [IPC.sendMessage, ['hello'], 'sendMessage'],
    [IPC.markMessagesRead, ['CHAT'], 'markMessagesRead'],
  ] as const)('%s reaches controller.%s', async (channel, args, command) => {
    await expect(invoke(channel, ...args)).resolves.toBe(command);

    expect(controller[command]).toHaveBeenCalledWith(...args);
  });

  it('closes the gallery before signing out, so the next user never sees the shots', async () => {
    await expect(invoke(IPC.logout)).resolves.toBeUndefined();

    expect(mocks.closeScreenshotsWindow).toHaveBeenCalled();
    expect(controller.logout).toHaveBeenCalled();
  });

  it('opens the gallery for the day asked for, from the main window', () => {
    const range = { startISO: FROM, endISO: TO };

    invoke(IPC.openScreenshots, range);

    expect(mocks.openScreenshotsWindow).toHaveBeenCalledWith(mainWindow(), range);
  });

  it('saves a report through a dialog attached to the main window', async () => {
    const report = { fileName: 'r.csv', content: 'a,b' };

    await expect(invoke(IPC.saveReport, report)).resolves.toEqual({ path: '/r.csv' });

    expect(mocks.saveReportFile).toHaveBeenCalledWith(mainWindow(), report);
  });

  it('opens the privacy page in the browser', () => {
    invoke(IPC.openPrivacy);

    expect(electron.shell.openExternal).toHaveBeenCalledWith(
      'https://portal.exyconn.com/me/tracker',
    );
  });
});

describe('the webcam photo', () => {
  it('takes the webcam photo through the main window', async () => {
    const compose = controller.args[2] as (input: unknown) => Promise<string | null>;

    await expect(compose({ screen: 'x' })).resolves.toBe('photo');

    expect(mocks.composeWithWebcam).toHaveBeenCalledWith(mainWindow(), { screen: 'x' });
  });
});

describe('preferences over IPC', () => {
  it('stores the update, applies automatic updates live, and keeps the window', async () => {
    const saved = invoke(IPC.setPreferences, { updateAutomatically: false });
    await h.flush();

    expect(saved).toMatchObject({ updateAutomatically: false });
    expect(controller.setPreferences).toHaveBeenCalledWith({ updateAutomatically: false });
    expect(updater.setAutomatic).toHaveBeenCalledWith(false);
    expect(h.FakeWindow.all).toHaveLength(1);
  });
});

describe('updates over IPC', () => {
  it('reports the version and the update state, and checks or downloads on request', () => {
    expect(invoke(IPC.getAppVersion)).toBe('1.10.6');
    expect(invoke(IPC.getUpdate)).toBe(updater.current);

    invoke(IPC.checkForUpdate);
    invoke(IPC.downloadUpdate);

    expect(updater.checkNow).toHaveBeenCalled();
    expect(updater.download).toHaveBeenCalled();
  });

  it('stops the session before restarting into the new version, and then really quits', async () => {
    await invoke(IPC.installUpdate);

    expect(controller.stop).toHaveBeenCalled();
    expect(updater.install).toHaveBeenCalled();
    expect(controller.stop.mock.invocationCallOrder[0]).toBeLessThan(
      updater.install.mock.invocationCallOrder[0],
    );

    mainWindow().events.get('close')?.({ preventDefault: vi.fn() });
    h.appEvents.get('window-all-closed')?.();
    expect(electron.app.quit).toHaveBeenCalled();
  });
});

describe('the transparent background switch', () => {
  it('rebuilds the window in the same place and state once the reply is sent', async () => {
    const old = mainWindow();
    old.visible = false;

    const saved = h.invoke(IPC.setPreferences, { transparentBackground: true });
    expect(saved).toMatchObject({ transparentBackground: true });
    await h.flush();

    const rebuilt = mainWindow();
    expect(rebuilt).not.toBe(old);
    expect(old.destroy).toHaveBeenCalled();
    expect(rebuilt.options).toMatchObject({ x: 10, y: 20, width: 500, height: 700 });
    rebuilt.events.get('ready-to-show')?.();
    expect(rebuilt.show).not.toHaveBeenCalled();
  });

  it('leaves a destroyed window alone', async () => {
    mainWindow().destroyed = true;

    h.invoke(IPC.setPreferences, { transparentBackground: true });
    await h.flush();

    expect(h.FakeWindow.all).toHaveLength(1);
  });
});
