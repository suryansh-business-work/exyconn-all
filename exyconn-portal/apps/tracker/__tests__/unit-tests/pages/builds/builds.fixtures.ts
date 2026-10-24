import type { TrackerBuildReleaseRow } from '../../../../src/pages/builds/builds.types';

const asset = (name: string, platform: string, downloadCount = 1) => ({
  __typename: 'TrackerReleaseAsset' as const,
  name,
  platform,
  sizeBytes: 2048,
  downloadCount,
  url: `https://dl.test/${name}`,
});

/** A published build with installers for the given files (name -> platform). */
export function buildRelease(
  id: string,
  version: string,
  files: ReadonlyArray<[string, string]>,
): TrackerBuildReleaseRow {
  return {
    __typename: 'TrackerBuildRelease',
    id,
    version,
    tag: `tracker-v${version}`,
    name: `Exyconn Tracker ${version}`,
    url: `https://github.test/releases/${version}`,
    publishedAt: '2026-10-20T10:00:00.000Z',
    assets: files.map(([name, platform]) => asset(name, platform, 2)),
  };
}

/** A full build: every desktop and phone installer. */
export const FULL = buildRelease('11', '1.4.0', [
  ['Setup-1.4.0.exe', 'windows'],
  ['Tracker-1.4.0.dmg', 'macos'],
  ['Tracker-1.4.0.AppImage', 'linux'],
  ['Tracker-1.4.0.apk', 'android'],
  ['Tracker-1.4.0.aab', 'android'],
  ['Tracker-1.4.0-unsigned.ipa', 'ios'],
]);

/** A phone-only build. */
export const PHONE = buildRelease('10', '1.3.9', [['Tracker-1.3.9.apk', 'android']]);
