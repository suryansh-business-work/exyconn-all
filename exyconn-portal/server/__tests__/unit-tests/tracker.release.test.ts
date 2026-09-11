import type { Request } from 'express';
import { githubActions, trackerAssetPlatform, toTrackerRelease } from '../../src/utils/github';
import { GithubConfigModel } from '../../src/modules/tech/github-config.model';
import { UserModel } from '../../src/modules/admin/user.model';
import { hashPassword } from '../../src/utils/password';
import { ROLES } from '../../src/constants/roles';
import { buildContext } from '../../src/middleware/auth';
import { trackerResolvers } from '../../src/modules/tracker/tracker.resolvers';
import { trackerAdminService } from '../../src/modules/tracker/tracker.admin.service';
import { trackerDeviceService } from '../../src/modules/tracker/tracker.device.service';

// The mailer talks to SMTP; stub the access-granted email so grants work offline.
jest.mock('../../src/utils/mailer', () => ({
  mailer: { sendTrackerAccessEmail: jest.fn().mockResolvedValue(undefined) },
}));

/** Never a literal: a credential in source is a credential in the repository. */
const PASSWORD = process.env.TEST_TRACKER_PASSWORD ?? 'Tracked@123';
const GITHUB_TOKEN = process.env.TEST_GITHUB_TOKEN ?? 'github-token';

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
    expect(trackerAssetPlatform('exyconn-tracker-1.3.0.apk')).toBe('android');
    expect(trackerAssetPlatform('ExyconnTracker-1.3.0.ipa')).toBe('ios');
  });

  it('does not offer the Play Store bundle as an installer', () => {
    expect(trackerAssetPlatform('exyconn-tracker-1.3.0.aab')).toBeNull();
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
    expect(result.assets.every((entry) => entry.version === '1.3.0')).toBe(true);
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

/** A GitHub release payload for `tag`, carrying the named files. */
function releaseWith(tag: string, files: string[], draft = false) {
  return {
    ...release,
    tag_name: tag,
    name: tag,
    draft,
    assets: files.map((file) => ({
      ...asset(file),
      browser_download_url: `https://example.com/${tag}/${file}`,
    })),
  };
}

/**
 * The repository's release list, newest first, as GitHub returns it: a draft and another
 * product's release on top, then a phone-only build, a macOS-only build, and a full one.
 */
const RELEASES = [
  releaseWith('tracker-v1.7.0', ['Exyconn Tracker-Setup-1.7.0.exe', 'latest.yml'], true),
  releaseWith('website-v9.0.0', ['latest.yml', 'site.exe']),
  releaseWith('tracker-v1.6.0', ['exyconn-tracker-1.6.0.apk', 'exyconn-tracker-1.6.0.aab']),
  releaseWith('tracker-v1.5.0', ['Exyconn Tracker-1.5.0.dmg', 'latest-mac.yml']),
  releaseWith('tracker-v1.4.0', [
    'Exyconn Tracker-Setup-1.4.0.exe',
    'latest.yml',
    'Exyconn Tracker-1.4.0.dmg',
    'latest-mac.yml',
  ]),
];

describe('reading tracker releases from GitHub', () => {
  beforeEach(async () => {
    await GithubConfigModel.create({
      label: 'Primary',
      owner: 'exyconn',
      repo: 'exyconn-all',
      token: GITHUB_TOKEN,
      isActive: true,
    });
    jest
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => new Response(JSON.stringify(RELEASES), { status: 200 }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('resolves every update file to the newest tracker release that carries it', async () => {
    const files = await githubActions.latestTrackerReleaseFiles();

    // A phone-only release must not hide the desktop updaters' manifests behind it.
    expect(files.get('latest-mac.yml')).toBe('https://example.com/tracker-v1.5.0/latest-mac.yml');
    expect(files.get('latest.yml')).toBe('https://example.com/tracker-v1.4.0/latest.yml');
    expect(files.get('exyconn-tracker-1.6.0.apk')).toBe(
      'https://example.com/tracker-v1.6.0/exyconn-tracker-1.6.0.apk',
    );
    expect(files.has('Exyconn Tracker-Setup-1.7.0.exe')).toBe(false);
    expect(files.has('site.exe')).toBe(false);
  });

  it('gives every platform its newest installer when no platform is asked for', async () => {
    const latest = await githubActions.latestTrackerRelease();

    // The newest release is phone-only; the Download page must still offer the desktop
    // builds from the releases before it, each labelled with its own version.
    expect(latest?.version).toBe('1.6.0');
    expect(latest?.assets.map((entry) => [entry.platform, entry.version])).toEqual([
      ['android', '1.6.0'],
      ['macos', '1.5.0'],
      ['windows', '1.4.0'],
    ]);
  });

  it('finds the newest release carrying an installer for one platform', async () => {
    expect((await githubActions.latestTrackerRelease('android'))?.version).toBe('1.6.0');
    expect((await githubActions.latestTrackerRelease('macos'))?.version).toBe('1.5.0');
    expect((await githubActions.latestTrackerRelease('windows'))?.version).toBe('1.4.0');
    expect(await githubActions.latestTrackerRelease('ios')).toBeNull();
  });
});

describe('the trackerLatestRelease query', () => {
  const DEVICE = { deviceId: 'phone-1', platform: 'android', hostname: 'Pixel' };

  /** The context a request carrying the phone app's device token resolves to. */
  async function deviceContext() {
    const passwordHash = await hashPassword(PASSWORD);
    const user = await UserModel.create({
      name: 'Emp',
      email: 'emp@exyconn.com',
      passwordHash,
      roles: [ROLES.EMPLOYEE],
    });
    await trackerAdminService.grantAccess(user.id, 'admin');
    const { token } = await trackerDeviceService.login('emp@exyconn.com', PASSWORD, DEVICE);
    const req = { ip: '127.0.0.1', headers: { authorization: `Bearer ${token}` } };
    return buildContext({ req: req as unknown as Request });
  }

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('answers a phone signed in with a device token, for its own platform', async () => {
    const lookup = jest.spyOn(githubActions, 'latestTrackerRelease').mockResolvedValue(null);
    const ctx = await deviceContext();

    await trackerResolvers.Query.trackerLatestRelease(undefined, { platform: 'android' }, ctx);

    expect(lookup).toHaveBeenCalledWith('android');
  });

  it('keeps asking for the newest release when no platform is given', async () => {
    const lookup = jest.spyOn(githubActions, 'latestTrackerRelease').mockResolvedValue(null);
    const ctx = await deviceContext();

    await trackerResolvers.Query.trackerLatestRelease(undefined, {}, ctx);

    expect(lookup).toHaveBeenCalledWith(undefined);
  });

  it('refuses a caller with no session', async () => {
    await expect(
      trackerResolvers.Query.trackerLatestRelease(undefined, {}, { user: null }),
    ).rejects.toThrow();
  });
});
