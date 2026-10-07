import {
  TRACKER_TAG_PREFIX,
  mergeNewestPerPlatform,
  toTrackerRelease,
  trackerAssetPlatform,
} from '../../../src/utils/github';

type Payload = Parameters<typeof toTrackerRelease>[0];

const asset = (name: string, size = 100) => ({
  name,
  size,
  download_count: 3,
  browser_download_url: `https://dl.test/${name}`,
});

const release = (version: string, names: string[], extra: Partial<Payload> = {}): Payload => ({
  tag_name: `${TRACKER_TAG_PREFIX}${version}`,
  name: `Tracker ${version}`,
  body: `Notes ${version}`,
  html_url: `https://github.test/releases/${version}`,
  draft: false,
  prerelease: false,
  published_at: '2026-10-01T10:00:00Z',
  created_at: '2026-09-30T10:00:00Z',
  assets: names.map((name) => asset(name)),
  ...extra,
});

describe('trackerAssetPlatform', () => {
  it.each([
    ['Exyconn Tracker Setup 1.2.0.exe', 'windows'],
    ['Exyconn-Tracker-1.2.0.dmg', 'macos'],
    ['Exyconn-Tracker-1.2.0.AppImage', 'linux'],
    ['tracker.apk', 'android'],
    ['tracker.aab', 'android'],
    ['tracker.ipa', 'ios'],
  ])('maps %s to %s', (fileName, platform) => {
    expect(trackerAssetPlatform(fileName)).toBe(platform);
  });

  it.each(['latest.yml', 'tracker.exe.blockmap', 'README', 'SHA256SUMS.txt'])(
    'ignores %s, which is not an installer',
    (fileName) => {
      expect(trackerAssetPlatform(fileName)).toBeNull();
    },
  );
});

describe('toTrackerRelease', () => {
  it('reshapes a release and keeps only installer assets', () => {
    const shaped = toTrackerRelease(release('1.2.0', ['a.exe', 'latest.yml']));
    expect(shaped).toEqual({
      version: '1.2.0',
      tag: 'tracker-v1.2.0',
      name: 'Tracker 1.2.0',
      notes: 'Notes 1.2.0',
      url: 'https://github.test/releases/1.2.0',
      publishedAt: new Date('2026-10-01T10:00:00Z'),
      assets: [
        {
          name: 'a.exe',
          platform: 'windows',
          version: '1.2.0',
          sizeBytes: 100,
          downloadCount: 3,
          url: 'https://dl.test/a.exe',
        },
      ],
    });
  });

  it('falls back to the tag, empty notes and the creation date', () => {
    const shaped = toTrackerRelease(
      release('1.0.0', ['a.dmg'], { name: null, body: null, published_at: null }),
    );
    expect(shaped.name).toBe('tracker-v1.0.0');
    expect(shaped.notes).toBe('');
    expect(shaped.publishedAt).toEqual(new Date('2026-09-30T10:00:00Z'));
  });
});

describe('mergeNewestPerPlatform', () => {
  it('answers null when there are no releases', () => {
    expect(mergeNewestPerPlatform([])).toBeNull();
  });

  it('keeps each platform from the newest release that has it', () => {
    const merged = mergeNewestPerPlatform([
      release('1.3.0', ['phone.apk']),
      release('1.2.0', ['desk.exe', 'old.apk']),
      release('1.1.0', ['desk.dmg', 'older.exe']),
    ]);
    expect(merged?.version).toBe('1.3.0');
    expect(merged?.assets.map((item) => [item.name, item.version])).toEqual([
      ['phone.apk', '1.3.0'],
      ['desk.exe', '1.2.0'],
      ['desk.dmg', '1.1.0'],
    ]);
  });
});
