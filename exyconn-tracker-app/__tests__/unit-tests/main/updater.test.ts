import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import type { UpdateState } from '@shared/types';

const { fake, listeners } = vi.hoisted(() => {
  const listeners = new Map<string, (payload: unknown) => void>();
  return {
    listeners,
    fake: {
      autoDownload: false,
      autoInstallOnAppQuit: false,
      setFeedURL: vi.fn(),
      on: (event: string, handler: (payload: unknown) => void) => listeners.set(event, handler),
      checkForUpdates: vi.fn((): Promise<unknown> => Promise.resolve(null)),
      downloadUpdate: vi.fn((): Promise<unknown> => Promise.resolve([])),
      quitAndInstall: vi.fn(),
    },
  };
});

vi.mock('electron-updater', () => ({ autoUpdater: fake }));

import { AppUpdater, IDLE_UPDATE } from '../../../src/main/updater';

const FEED = 'https://portal-server.exyconn.com/graphql';
const emit = (event: string, payload: unknown = {}) => listeners.get(event)?.(payload);

let seen: UpdateState[];
let consoleError: MockInstance;

beforeEach(() => {
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-09-14T10:00:00.000Z'));
  listeners.clear();
  seen = [];
  fake.checkForUpdates.mockReset().mockResolvedValue(null);
  fake.downloadUpdate.mockReset().mockResolvedValue([]);
});

afterEach(() => {
  vi.useRealTimers();
  consoleError.mockRestore();
});

describe('AppUpdater before a feed is wired (a development build)', () => {
  it('starts idle, with nothing to install', () => {
    const updater = new AppUpdater((state) => seen.push(state));

    expect(updater.current).toEqual(IDLE_UPDATE);
    expect(updater.installsAutomatically).toBe(false);
  });

  it('answers “check now” with the time it looked and never reaches the feed', async () => {
    const updater = new AppUpdater((state) => seen.push(state));

    await updater.checkNow();

    expect(fake.checkForUpdates).not.toHaveBeenCalled();
    expect(updater.current).toEqual({ ...IDLE_UPDATE, lastCheckedAt: '2026-09-14T10:00:00.000Z' });
    expect(seen).toHaveLength(1);
  });

  it('stopping a timer that never started is harmless', () => {
    const updater = new AppUpdater(() => undefined);

    expect(() => updater.stop()).not.toThrow();
  });

  it('remembers turning automatic updates off without downloading anything', () => {
    const updater = new AppUpdater(() => undefined);

    updater.setAutomatic(false);

    expect(fake.autoDownload).toBe(false);
    expect(fake.downloadUpdate).not.toHaveBeenCalled();
  });
});

describe('AppUpdater with a feed', () => {
  function started(): AppUpdater {
    const updater = new AppUpdater((state) => seen.push(state));
    updater.start(FEED, false);
    return updater;
  }

  it('does not re-check while a version is downloading or waiting to install', async () => {
    const updater = started();
    emit('update-available', { version: '2.0.0' });
    updater.download();

    await updater.checkNow();
    emit('update-downloaded', { version: '2.0.0' });
    await updater.checkNow();

    expect(fake.checkForUpdates).not.toHaveBeenCalled();
    updater.stop();
  });

  it('reports a check that the feed refused as failed, stamped with when it tried', async () => {
    fake.checkForUpdates.mockRejectedValue(new Error('feed unreachable'));
    const updater = started();

    await updater.checkNow();

    expect(updater.current).toMatchObject({
      stage: 'failed',
      percent: 0,
      lastCheckedAt: '2026-09-14T10:00:00.000Z',
    });
    expect(consoleError).toHaveBeenCalledWith('Update check failed', expect.any(Error));
    updater.stop();
  });

  it('logs a scheduled check that throws instead of letting it go unhandled', async () => {
    fake.checkForUpdates.mockImplementation(() => {
      throw new Error('not configured');
    });
    const updater = started();

    vi.advanceTimersByTime(15_000);

    await vi.waitFor(() =>
      expect(consoleError).toHaveBeenCalledWith('Scheduled update check failed', expect.any(Error)),
    );
    updater.stop();
  });

  it('stays on the version found when automatic updates are switched off again', () => {
    const updater = started();
    emit('update-available', { version: '2.0.0' });

    updater.setAutomatic(false);

    expect(updater.current.stage).toBe('available');
    expect(fake.downloadUpdate).not.toHaveBeenCalled();
    updater.stop();
  });
});
