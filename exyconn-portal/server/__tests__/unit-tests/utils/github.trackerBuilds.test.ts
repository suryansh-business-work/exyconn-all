import { githubActions } from '../../../src/utils/github';
import { REPO, active, config, json, release, stubGithub } from './github.fixtures';

let fetchMock: jest.SpyInstance;

beforeEach(() => {
  fetchMock = stubGithub();
  active(config);
});

afterEach(() => {
  jest.restoreAllMocks();
});

/** A release payload with an id, as the release endpoints return it. */
const withId = (id: number, tag: string, names: string[], draft = false) => ({
  id,
  ...release(tag, names, draft),
});

const called = (index: number) => [
  String(fetchMock.mock.calls[index][0]),
  (fetchMock.mock.calls[index][1] as RequestInit | undefined)?.method ?? 'GET',
];

describe('listing every tracker build', () => {
  it('walks the pages until a short one and keeps only published tracker tags', async () => {
    const full = Array.from({ length: 100 }, (_, i) => withId(i, `tracker-v1.0.${i}`, ['a.exe']));
    fetchMock
      .mockResolvedValueOnce(json(full))
      .mockResolvedValueOnce(
        json([
          withId(200, 'tracker-v0.9.0', ['old.apk']),
          withId(201, 'tracker-v0.9.1', ['draft.exe'], true),
          withId(202, 'website-v3', ['site.exe']),
        ]),
      );

    const builds = await githubActions.listAllTrackerReleases();

    expect(called(0)[0]).toBe(`${REPO}/releases?per_page=100&page=1`);
    expect(called(1)[0]).toBe(`${REPO}/releases?per_page=100&page=2`);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(builds).toHaveLength(101);
    expect(builds.at(-1)).toMatchObject({ id: '200', version: '0.9.0', tag: 'tracker-v0.9.0' });
  });

  it('stops after ten pages however many there are', async () => {
    const full = Array.from({ length: 100 }, (_, i) => withId(i, `tracker-v2.0.${i}`, ['a.exe']));
    fetchMock.mockImplementation(async () => json(full));

    await githubActions.listAllTrackerReleases();

    expect(fetchMock).toHaveBeenCalledTimes(10);
  });

  it('answers nothing when the repository has no releases', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    await expect(githubActions.listAllTrackerReleases()).resolves.toEqual([]);
  });
});

describe('deleting a tracker build', () => {
  it('deletes the release, then its tag', async () => {
    fetchMock
      .mockResolvedValueOnce(json(withId(7, 'tracker-v1.2.3', ['a.exe'])))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    const deleted = await githubActions.deleteTrackerRelease('7');

    expect(called(0)).toEqual([`${REPO}/releases/7`, 'GET']);
    expect(called(1)).toEqual([`${REPO}/releases/7`, 'DELETE']);
    expect(called(2)).toEqual([`${REPO}/git/refs/tags/tracker-v1.2.3`, 'DELETE']);
    expect(deleted).toMatchObject({ id: '7', version: '1.2.3' });
  });

  it('refuses a release that is not a tracker build, deleting nothing', async () => {
    fetchMock.mockResolvedValueOnce(json(withId(8, 'website-v3', ['site.exe'])));

    await expect(githubActions.deleteTrackerRelease('8')).rejects.toThrow(
      'Release 8 is not a tracker build.',
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('passes on what GitHub refuses', async () => {
    fetchMock.mockResolvedValueOnce(new Response('Not Found', { status: 404 }));

    await expect(githubActions.deleteTrackerRelease('9')).rejects.toThrow(
      'GitHub /releases/9 failed (404): Not Found',
    );
  });
});
