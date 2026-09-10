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
  downloadCalls: 0,
  downloadRejects: false,
  downloadUpdate(): Promise<unknown> {
    fake.downloadCalls += 1;
    return fake.downloadRejects ? Promise.reject(new Error('offline')) : Promise.resolve([]);
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
    fake.downloadCalls = 0;
    fake.downloadRejects = false;
    updater = new AppUpdater((state) => seen.push(state));
    updater.start('https://portal-server.exyconn.com/graphql', false);
  });

  afterEach(() => {
    updater.stop();
    vi.useRealTimers();
  });

  it('points the updater at the portal and waits to be asked before downloading', () => {
    expect(fake.feedUrl).toEqual({
      provider: 'generic',
      url: 'https://portal-server.exyconn.com/tracker-updates',
    });
    // Never automatic: pulling hundreds of megabytes decides for the employee that now is a
    // good moment to use their connection, and on a tethered phone it is not.
    expect(fake.autoDownload).toBe(false);
    // Still installs itself on quit, so an employee who says yes once is not asked again.
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

  it('offers a found version instead of fetching it, then reports the fetch', () => {
    emit('update-available', { version: '2.0.0' });

    // The stage that used to be missing: the version is on screen before a byte is fetched.
    expect(updater.current).toMatchObject({ stage: 'available', version: '2.0.0', percent: 0 });
    expect(fake.downloadCalls).toBe(0);

    updater.download();
    emit('download-progress', { percent: 42.6 });
    emit('update-downloaded', { version: '2.0.0' });

    expect(fake.downloadCalls).toBe(1);
    expect(seen.map(({ stage, version, percent }) => ({ stage, version, percent }))).toEqual([
      { stage: 'available', version: '2.0.0', percent: 0 },
      { stage: 'downloading', version: '2.0.0', percent: 0 },
      { stage: 'downloading', version: '2.0.0', percent: 43 },
      { stage: 'ready', version: '2.0.0', percent: 100 },
    ]);
  });

  it('keeps the version when a download fails, so Retry knows what to retry', async () => {
    emit('update-available', { version: '2.0.0' });
    fake.downloadRejects = true;

    updater.download();
    await vi.waitFor(() => expect(updater.current.stage).toBe('failed'));

    expect(updater.current.version).toBe('2.0.0');
  });

  it('retries a failed download', () => {
    emit('update-available', { version: '2.0.0' });
    updater.download();
    emit('error', new Error('connection reset'));

    updater.download();

    expect(fake.downloadCalls).toBe(2);
  });

  it('ignores a download nobody has an available version for', () => {
    updater.download();

    expect(fake.downloadCalls).toBe(0);
  });

  it('does not restart a download that is already running', () => {
    emit('update-available', { version: '2.0.0' });
    updater.download();
    updater.download();

    expect(fake.downloadCalls).toBe(1);
  });

  it('stops checking once a version is waiting, so the offer is never withdrawn', () => {
    emit('update-downloaded', { version: '2.0.0' });
    vi.advanceTimersByTime(24 * 60 * 60_000);

    expect(fake.checkCalls).toBe(0);
    expect(updater.current.stage).toBe('ready');
  });

  it('reports a failed check without disturbing anything else', () => {
    emit('error', new Error('feed unreachable'));

    expect(updater.current).toMatchObject({ stage: 'failed', version: '', percent: 0 });
  });

  it('goes back to idle when the install is already the newest', () => {
    emit('checking-for-update');
    emit('update-not-available');

    expect(updater.current).toMatchObject({ stage: 'idle', version: '', percent: 0 });
  });

  /**
   * An up-to-date app returns to the same `idle` it started in, so without the timestamp
   * "I checked and you are current" is indistinguishable from "I never looked".
   */
  it('stamps when it last looked, so an unchanged stage still reports the check', () => {
    expect(updater.current.lastCheckedAt).toBeNull();

    emit('checking-for-update');
    emit('update-not-available');

    expect(updater.current.lastCheckedAt).not.toBeNull();
  });

  it('fetches on its own once background updates are turned on mid-session', () => {
    emit('update-available', { version: '2.0.0' });
    expect(fake.downloadCalls).toBe(0);

    updater.setAutoDownload(true);

    // The employee turned it on because a version was already waiting — making them wait for
    // the next launch would answer a request with a delay.
    expect(fake.autoDownload).toBe(true);
    expect(fake.downloadCalls).toBe(1);
  });

  it('installs the downloaded version on request', () => {
    updater.install();
    expect(fake.quitCalls).toBe(1);
  });
});
