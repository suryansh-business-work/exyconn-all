import type { LatestRelease } from '@exyconn/tracker-core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { portal } from '../../../src/tracker/platform';
import {
  checkForUpdate,
  getUpdate,
  openUpdate,
  subscribeUpdate,
} from '../../../src/tracker/updates';
import { Linking, Platform } from '../mocks/react-native/apis';

vi.mock('../../../src/tracker/platform', () => ({ portal: { fetchLatestRelease: vi.fn() } }));

const fetchLatest = vi.mocked(portal.fetchLatestRelease);

function release(overrides: Partial<LatestRelease> = {}): LatestRelease {
  return {
    version: '1.1.0',
    url: 'https://example.test/releases/1.1.0',
    publishedAt: '2026-09-10T00:00:00.000Z',
    assets: [
      {
        name: 'Tracker-1.1.0.aab',
        platform: 'android',
        url: 'https://example.test/t.aab',
        sizeBytes: 9,
      },
      {
        name: 'Tracker-1.1.0.APK',
        platform: 'android',
        url: 'https://example.test/t.apk',
        sizeBytes: 8,
      },
    ],
    ...overrides,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('checkForUpdate', () => {
  it('starts idle, never having looked', () => {
    expect(getUpdate()).toEqual({ stage: 'idle', version: '', url: '', lastCheckedAt: null });
  });

  it('points an iPhone at the release page of a newer build', async () => {
    fetchLatest.mockResolvedValue(release());
    await checkForUpdate();
    expect(fetchLatest).toHaveBeenCalledWith('ios');
    expect(getUpdate()).toMatchObject({
      stage: 'available',
      version: '1.1.0',
      url: 'https://example.test/releases/1.1.0',
    });
    expect(getUpdate().lastCheckedAt).not.toBeNull();
  });

  it('points an Android phone at the APK, never the Play Console bundle', async () => {
    Platform.OS = 'android';
    fetchLatest.mockResolvedValue(release());
    await checkForUpdate();
    expect(fetchLatest).toHaveBeenCalledWith('android');
    expect(getUpdate().url).toBe('https://example.test/t.apk');
  });

  it('falls back to the release page when an Android release has no APK', async () => {
    Platform.OS = 'android';
    fetchLatest.mockResolvedValue(release({ assets: [] }));
    await checkForUpdate();
    expect(getUpdate().url).toBe('https://example.test/releases/1.1.0');
  });

  it('settles back to idle when this build is current, or there is no release', async () => {
    fetchLatest.mockResolvedValue(release({ version: '1.0.0' }));
    await checkForUpdate();
    expect(getUpdate()).toMatchObject({ stage: 'idle', version: '', url: '' });
    fetchLatest.mockResolvedValue(null);
    await checkForUpdate();
    expect(getUpdate().stage).toBe('idle');
  });

  it('reports a failed check, logs it, and keeps tracking', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const cause = new Error('offline');
    fetchLatest.mockRejectedValue(cause);
    await checkForUpdate();
    expect(getUpdate().stage).toBe('failed');
    expect(getUpdate().lastCheckedAt).not.toBeNull();
    expect(error).toHaveBeenCalledWith('Update check failed', cause);
  });

  it('tells subscribers about every stage until they unsubscribe', async () => {
    const stages: string[] = [];
    const unsubscribe = subscribeUpdate(() => stages.push(getUpdate().stage));
    fetchLatest.mockResolvedValue(release());
    await checkForUpdate();
    expect(stages).toEqual(['checking', 'available']);
    unsubscribe();
    await checkForUpdate();
    expect(stages).toHaveLength(2);
  });
});

describe('openUpdate', () => {
  it('opens the newer build’s download', async () => {
    fetchLatest.mockResolvedValue(release());
    await checkForUpdate();
    await openUpdate();
    expect(Linking.openURL).toHaveBeenCalledWith('https://example.test/releases/1.1.0');
  });

  it('opens nothing when there is no newer build', async () => {
    fetchLatest.mockResolvedValue(release({ version: '0.9.0' }));
    await checkForUpdate();
    await openUpdate();
    expect(Linking.openURL).not.toHaveBeenCalled();
  });
});
