import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { UpdateState } from '@shared/types';

/** A stand-in for electron-updater: records what was configured, replays what we emit. */
const listeners = new Map<string, (payload: unknown) => void>();
const fake = {
  autoDownload: false,
  autoInstallOnAppQuit: false,
  feedUrl: null as unknown,
  quitCalls: 0,
  checkCalls: 0,
  setFeedURL(options: unknown): void {
    fake.feedUrl = options;
  },
  on(event: string, handler: (payload: unknown) => void): void {
    listeners.set(event, handler);
  },
  checkForUpdates(): Promise<null> {
    fake.checkCalls += 1;
    return Promise.resolve(null);
  },
  quitAndInstall(): void {
    fake.quitCalls += 1;
  },
};

vi.mock('electron-updater', () => ({ autoUpdater: fake }));

const { AppUpdater, feedUrlFor } = await import('./updater');

function emit(event: string, payload: unknown = {}): void {
  listeners.get(event)?.(payload);
}

describe('feedUrlFor', () => {
  it('serves the feed from the portal the app already talks to', () => {
    expect(feedUrlFor('https://portal-server.exyconn.com/graphql')).toBe(
      'https://portal-server.exyconn.com/tracker-updates',
    );
  });
});

describe('AppUpdater', () => {
  let seen: UpdateState[] = [];
  let updater: InstanceType<typeof AppUpdater>;

  beforeEach(() => {
    vi.useFakeTimers();
    listeners.clear();
    seen = [];
    fake.checkCalls = 0;
    fake.quitCalls = 0;
    updater = new AppUpdater((state) => seen.push(state));
    updater.start('https://portal-server.exyconn.com/graphql');
  });

  afterEach(() => {
    updater.stop();
    vi.useRealTimers();
  });

  it('points the updater at the portal and downloads on its own', () => {
    expect(fake.feedUrl).toEqual({
      provider: 'generic',
      url: 'https://portal-server.exyconn.com/tracker-updates',
    });
    expect(fake.autoDownload).toBe(true);
    expect(fake.autoInstallOnAppQuit).toBe(true);
  });

  it('waits before the first check, so launch is not competing with it', () => {
    expect(fake.checkCalls).toBe(0);
    vi.advanceTimersByTime(15_000);
    expect(fake.checkCalls).toBe(1);
  });

  it('keeps checking on a schedule while nothing is found', () => {
    vi.advanceTimersByTime(15_000 + 6 * 60 * 60_000);
    expect(fake.checkCalls).toBe(2);
  });

  it('reports the download and then the version waiting to install', () => {
    emit('update-available', { version: '2.0.0' });
    emit('download-progress', { percent: 42.6 });
    emit('update-downloaded', { version: '2.0.0' });

    expect(seen).toEqual([
      { stage: 'downloading', version: '2.0.0', percent: 0 },
      { stage: 'downloading', version: '2.0.0', percent: 43 },
      { stage: 'ready', version: '2.0.0', percent: 100 },
    ]);
    expect(updater.current.stage).toBe('ready');
  });

  it('stops checking once a version is waiting, so the offer is never withdrawn', () => {
    emit('update-downloaded', { version: '2.0.0' });
    vi.advanceTimersByTime(24 * 60 * 60_000);

    expect(fake.checkCalls).toBe(0);
    expect(updater.current.stage).toBe('ready');
  });

  it('reports a failed check without disturbing anything else', () => {
    emit('error', new Error('feed unreachable'));

    expect(updater.current).toEqual({ stage: 'failed', version: '', percent: 0 });
  });

  it('goes back to idle when the install is already the newest', () => {
    emit('checking-for-update');
    emit('update-not-available');

    expect(updater.current).toEqual({ stage: 'idle', version: '', percent: 0 });
  });

  it('installs the downloaded version on request', () => {
    updater.install();
    expect(fake.quitCalls).toBe(1);
  });
});
