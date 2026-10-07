import { githubActions } from '../../../src/utils/github';
import { REPO, active, config, json, release, stubGithub } from './github.fixtures';

let fetchMock: jest.SpyInstance;

beforeEach(() => {
  fetchMock = stubGithub();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('tracker releases', () => {
  const releases = [
    release('tracker-v2.0.0', ['phone.apk', 'latest.yml']),
    release('tracker-v2.1.0', ['draft.exe'], true),
    release('website-v9', ['site.exe']),
    release('tracker-v1.9.0', ['notes.txt']),
    release('tracker-v1.8.0', ['desk.exe', 'latest.yml', 'latest-mac.yml']),
  ];

  it('merges every platform newest installers, skipping drafts and other tags', async () => {
    active(config);
    fetchMock.mockResolvedValue(json(releases));
    const latest = await githubActions.latestTrackerRelease();
    expect(String(fetchMock.mock.calls[0][0])).toBe(`${REPO}/releases?per_page=20`);
    expect(latest?.version).toBe('2.0.0');
    expect(latest?.assets.map((item) => item.name)).toEqual(['phone.apk', 'desk.exe']);
  });

  it('answers the newest release carrying an installer for one platform', async () => {
    active(config);
    fetchMock.mockResolvedValue(json(releases));
    const windows = await githubActions.latestTrackerRelease('windows');
    expect(windows?.version).toBe('1.8.0');
  });

  it('answers null when no release carries that platform', async () => {
    active(config);
    fetchMock.mockResolvedValue(json(releases));
    await expect(githubActions.latestTrackerRelease('ios')).resolves.toBeNull();
  });

  it('answers null when there are no releases at all', async () => {
    active(config);
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    await expect(githubActions.latestTrackerRelease(null)).resolves.toBeNull();
  });

  it('maps every file name to the newest release that has it', async () => {
    active(config);
    fetchMock.mockResolvedValue(json(releases));
    const files = await githubActions.latestTrackerReleaseFiles();
    expect(Object.fromEntries(files)).toEqual({
      'phone.apk': 'https://dl.test/tracker-v2.0.0/phone.apk',
      'latest.yml': 'https://dl.test/tracker-v2.0.0/latest.yml',
      'desk.exe': 'https://dl.test/tracker-v1.8.0/desk.exe',
      'latest-mac.yml': 'https://dl.test/tracker-v1.8.0/latest-mac.yml',
    });
  });
});
