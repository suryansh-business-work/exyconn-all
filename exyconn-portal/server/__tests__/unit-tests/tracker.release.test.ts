import { trackerAssetPlatform, toTrackerRelease } from '../../src/utils/github';

const asset = (name: string) => ({
  name,
  size: 1024,
  download_count: 3,
  browser_download_url: `https://example.com/${name}`,
});

const release = {
  tag_name: 'tracker-v1.3.0',
  name: 'Exyconn Tracker 1.3.0',
  body: 'Notes',
  html_url: 'https://example.com/release',
  draft: false,
  prerelease: false,
  published_at: '2026-09-01T10:00:00.000Z',
  created_at: '2026-09-01T09:00:00.000Z',
  assets: [
    asset('Exyconn Tracker-Setup-1.3.0.exe'),
    asset('Exyconn Tracker-1.3.0.dmg'),
    asset('Exyconn Tracker-1.3.0.AppImage'),
  ],
};

describe('trackerAssetPlatform', () => {
  it('maps each installer extension to its platform', () => {
    expect(trackerAssetPlatform('Setup.exe')).toBe('windows');
    expect(trackerAssetPlatform('Tracker.dmg')).toBe('macos');
    expect(trackerAssetPlatform('Tracker.AppImage')).toBe('linux');
  });

  it('ignores files that are not installers', () => {
    expect(trackerAssetPlatform('latest.yml')).toBeNull();
    expect(trackerAssetPlatform('Setup.exe.blockmap')).toBeNull();
    expect(trackerAssetPlatform('README')).toBeNull();
  });
});

describe('toTrackerRelease', () => {
  it('reads the version off the tag and keeps every installer', () => {
    const result = toTrackerRelease(release);

    expect(result.version).toBe('1.3.0');
    expect(result.tag).toBe('tracker-v1.3.0');
    expect(result.publishedAt.toISOString()).toBe('2026-09-01T10:00:00.000Z');
    expect(result.assets.map((entry) => entry.platform)).toEqual(['windows', 'macos', 'linux']);
    expect(result.assets[0].url).toBe('https://example.com/Exyconn Tracker-Setup-1.3.0.exe');
  });

  it('drops non-installer files and falls back to the creation date', () => {
    const result = toTrackerRelease({
      ...release,
      name: null,
      body: null,
      published_at: null,
      assets: [asset('latest.yml'), asset('Exyconn Tracker-1.3.0.dmg')],
    });

    expect(result.name).toBe('tracker-v1.3.0');
    expect(result.notes).toBe('');
    expect(result.publishedAt.toISOString()).toBe('2026-09-01T09:00:00.000Z');
    expect(result.assets).toHaveLength(1);
    expect(result.assets[0].platform).toBe('macos');
  });
});
