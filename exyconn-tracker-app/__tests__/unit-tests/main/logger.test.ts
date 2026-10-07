import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LogBatch } from '@exyconn/logger';
import type { AuthUser, DeviceInfo, TrackerLoggerConfig } from '@exyconn/tracker-core';

const { createTrackerLogger, collectDeviceInfo, reportClientLogs, ready, storage } = vi.hoisted(
  () => ({
    createTrackerLogger: vi.fn((_config: unknown) => ({ info: vi.fn() })),
    collectDeviceInfo: vi.fn(),
    reportClientLogs: vi.fn(() => Promise.resolve(true)),
    ready: { value: false },
    storage: { read: () => null, write: () => undefined },
  }),
);

vi.mock('electron', () => ({ app: { isReady: () => ready.value } }));
vi.mock('@exyconn/tracker-core', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/tracker-core')>()),
  createTrackerLogger,
}));
vi.mock('../../../src/main/device-info', () => ({ collectDeviceInfo }));
vi.mock('../../../src/main/file-storage', () => ({ userDataFile: vi.fn(() => storage) }));
vi.mock('../../../src/main/portal-client', () => ({ reportClientLogs }));

const DEVICE: DeviceInfo = {
  deviceId: 'device-1',
  platform: 'linux',
  hostname: 'desk-7',
  appVersion: '1.10.6',
  machineId: 'machine-1',
  osName: 'Linux',
  osVersion: '6.8.0',
  arch: 'x64',
  cpuModel: 'Ryzen 7',
  cpuCores: 8,
  totalMemoryMb: 16_384,
  locale: 'en-GB',
  timezone: 'Europe/London',
  screenCount: 1,
  screenResolution: '1920x1080',
};

const USER: AuthUser = { id: 'u1', name: 'Asha Rao', email: 'asha@example.com' };

const BATCH = {
  source: 'DESKTOP',
  app: 'tracker-desktop',
  sessionId: 'session-1',
  entries: [],
} as unknown as LogBatch;

/** Device and user are module state, so every case loads the module afresh. */
async function load() {
  vi.resetModules();
  createTrackerLogger.mockClear();
  collectDeviceInfo.mockReset().mockReturnValue(DEVICE);
  reportClientLogs.mockClear();
  const module = await import('../../../src/main/logger');
  const config = createTrackerLogger.mock.calls[0][0] as TrackerLoggerConfig;
  return { ...module, config };
}

beforeEach(() => {
  ready.value = false;
});

describe('the desktop logger', () => {
  it('reports as the desktop tracker, through the portal, queued under userData', async () => {
    const { config, logger } = await load();

    expect(config.source).toBe('DESKTOP');
    expect(config.app).toBe('tracker-desktop');
    expect(config.portal.reportClientLogs).toBe(reportClientLogs);
    expect(config.storage).toBe(storage);
    expect(logger).toBe(createTrackerLogger.mock.results[0].value);
  });

  it('leaves the device off until the app is ready, then reads it once', async () => {
    const { config } = await load();

    expect(config.device()).toBeNull();
    expect(collectDeviceInfo).not.toHaveBeenCalled();

    ready.value = true;
    expect(config.device()).toBe(DEVICE);
    expect(config.device()).toBe(DEVICE);
    expect(collectDeviceInfo).toHaveBeenCalledTimes(1);
  });

  it('names whoever is signed in now', async () => {
    const { config, setLogUser } = await load();

    expect(config.user()).toBeNull();
    setLogUser(USER);
    expect(config.user()).toBe(USER);
    setLogUser(null);
    expect(config.user()).toBeNull();
  });
});

describe('forwardRendererLogs', () => {
  it('stamps a renderer batch with the device and user before sending it', async () => {
    const { forwardRendererLogs, setLogUser } = await load();
    ready.value = true;
    setLogUser(USER);

    await expect(forwardRendererLogs(BATCH)).resolves.toBe(true);

    expect(reportClientLogs).toHaveBeenCalledWith({
      ...BATCH,
      appVersion: '1.10.6',
      platform: 'linux',
      osVersion: '6.8.0',
      deviceModel: 'Ryzen 7 x64',
      deviceId: 'device-1',
      user: USER,
    });
  });

  it('sends an unlabelled batch before the app is ready', async () => {
    const { forwardRendererLogs } = await load();

    await forwardRendererLogs(BATCH);

    expect(reportClientLogs).toHaveBeenCalledWith(
      expect.objectContaining({ deviceId: null, appVersion: null, user: null }),
    );
  });
});
