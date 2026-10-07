import {
  PLATFORMS,
  type PlatformConfig,
  type PlatformKey,
} from '../../../../src/pages/download/download.config';

/** The configured platform for a key, failing loudly when the config no longer has it. */
export function platformOf(key: PlatformKey): PlatformConfig {
  const platform = PLATFORMS.find((entry) => entry.key === key);
  if (!platform) {
    throw new Error(`No platform "${key}" in download.config`);
  }
  return platform;
}

/** One release file, as the latest-release query returns it. */
export function releaseAsset(name: string, platform: PlatformKey, version = '1.9.9') {
  return {
    __typename: 'TrackerReleaseAsset' as const,
    name,
    platform,
    version,
    sizeBytes: 5 * 1024 * 1024,
    downloadCount: 12,
    url: `https://downloads.example.test/${encodeURIComponent(name)}`,
  };
}

export const PUBLISHED_AT = '2026-10-03T09:00:00.000Z';

/** The latest release: a macOS build carried over from 1.9.8 and a fresh Windows one. */
export const RELEASE = {
  __typename: 'TrackerRelease' as const,
  version: '1.9.9',
  tag: 'tracker-v1.9.9',
  name: 'Tracker 1.9.9',
  notes: '',
  url: 'https://github.example.test/releases/tracker-v1.9.9',
  publishedAt: PUBLISHED_AT,
  assets: [
    releaseAsset('Exyconn Tracker-1.9.8-universal.dmg', 'macos', '1.9.8'),
    releaseAsset('Exyconn Tracker-Setup-1.9.9.exe', 'windows'),
  ],
};
