import {
  releasesBeyondRetention,
  startTrackerBuildRetention,
  trackerReleasesService,
} from '../../../../src/modules/tech/tracker-releases.service';
import { TrackerBuildSettingsModel } from '../../../../src/modules/tech/tracker-build-settings.model';
import { findBackgroundJob } from '../../../../src/modules/tech/jobs.registry';
import { githubActions, type TrackerRelease } from '../../../../src/utils/github';
import { JOB_KEYS, readJobRuns } from '../../../../src/utils/jobHeartbeat';
import { logger } from '../../../../src/utils/logger';
import { codeOf } from '../codeOf';

/** A build with installers for the given platforms. */
const build = (id: string, ...platforms: string[]): TrackerRelease => ({
  id,
  version: `1.0.${id}`,
  tag: `tracker-v1.0.${id}`,
  name: id,
  notes: '',
  url: `https://github.test/${id}`,
  publishedAt: new Date('2026-10-01T00:00:00Z'),
  assets: platforms.map((platform) => ({
    name: `${id}.${platform}`,
    platform,
    version: `1.0.${id}`,
    sizeBytes: 1,
    downloadCount: 0,
    url: `https://dl.test/${id}/${platform}`,
  })),
});

const ids = (releases: readonly TrackerRelease[]) => releases.map((release) => release.id);

describe('which builds retention lets go', () => {
  // Newest first: a phone-only build on top, then two full ones, then old ones.
  const releases = [
    build('5', 'android'),
    build('4', 'windows', 'macos', 'android'),
    build('3', 'windows', 'macos', 'android'),
    build('2', 'linux'),
    build('1', 'windows'),
  ];

  it('keeps everything when retention is off', () => {
    expect(releasesBeyondRetention(releases, 0)).toEqual([]);
  });

  it('deletes past the newest N, but never the newest build of a platform', () => {
    // Build 2 is the only Linux build, so it stays though it is past the newest two.
    expect(ids(releasesBeyondRetention(releases, 2))).toEqual(['3', '1']);
    expect(ids(releasesBeyondRetention(releases, 1))).toEqual(['3', '1']);
  });

  it('deletes nothing when every build is within the count', () => {
    expect(releasesBeyondRetention(releases, 10)).toEqual([]);
  });
});

describe('the retention setting', () => {
  it('is stored on the single settings row', async () => {
    await expect(trackerReleasesService.saveRetention(5)).resolves.toMatchObject({
      keepLatestBuilds: 5,
    });
    await trackerReleasesService.saveRetention(0);
    expect(await TrackerBuildSettingsModel.countDocuments()).toBe(1);
    expect((await TrackerBuildSettingsModel.findOne().lean())?.keepLatestBuilds).toBe(0);
  });

  it.each([
    [-1, 'Builds to keep must be a whole number, 0 or more.'],
    [2.5, 'Builds to keep must be a whole number, 0 or more.'],
    [501, 'Builds to keep can be at most 500.'],
  ])('refuses %s', async (value, message) => {
    await expect(trackerReleasesService.saveRetention(value)).rejects.toThrow(message);
    expect(await codeOf(trackerReleasesService.saveRetention(value))).toBe('BAD_USER_INPUT');
  });
});

describe('a retention pass', () => {
  beforeEach(() => {
    jest.spyOn(logger, 'error').mockImplementation(() => undefined);
  });
  afterEach(() => jest.restoreAllMocks());

  it('does nothing, and asks GitHub nothing, until a count is set', async () => {
    const list = jest.spyOn(githubActions, 'listAllTrackerReleases');
    await expect(trackerReleasesService.applyRetention()).resolves.toBe(0);
    await trackerReleasesService.saveRetention(0);
    await expect(trackerReleasesService.applyRetention()).resolves.toBe(0);
    expect(list).not.toHaveBeenCalled();
  });

  it('deletes the builds past the count, carrying on past one GitHub refuses', async () => {
    await trackerReleasesService.saveRetention(1);
    jest
      .spyOn(githubActions, 'listAllTrackerReleases')
      .mockResolvedValue([build('3', 'windows'), build('2', 'windows'), build('1', 'windows')]);
    const remove = jest
      .spyOn(githubActions, 'deleteTrackerRelease')
      .mockRejectedValueOnce(new Error('rate limited'))
      .mockResolvedValueOnce(build('1', 'windows'));

    await expect(trackerReleasesService.applyRetention()).resolves.toBe(1);

    expect(remove.mock.calls).toEqual([['2'], ['1']]);
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ tag: 'tracker-v1.0.2' }),
      'Could not delete an old tracker build',
    );
    expect(readJobRuns().get(JOB_KEYS.trackerBuildRetention)?.summary).toBe(
      'Kept the newest 1, deleted 1 of 2',
    );
  });

  it('is the pass the background job takes on request', async () => {
    const pass = jest.spyOn(trackerReleasesService, 'applyRetention').mockResolvedValue(0);
    await findBackgroundJob(JOB_KEYS.trackerBuildRetention)?.runOnce();
    expect(pass).toHaveBeenCalledTimes(1);
  });

  it('lists and deletes through GitHub', async () => {
    const list = jest.spyOn(githubActions, 'listAllTrackerReleases').mockResolvedValue([]);
    const remove = jest
      .spyOn(githubActions, 'deleteTrackerRelease')
      .mockResolvedValue(build('9', 'ios'));
    await expect(trackerReleasesService.list()).resolves.toEqual([]);
    await expect(trackerReleasesService.delete('9')).resolves.toMatchObject({ id: '9' });
    expect(list).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalledWith('9');
  });
});

describe('the hourly loop', () => {
  afterEach(() => jest.restoreAllMocks());

  it('takes a pass at once and then every hour, logging a failed one', async () => {
    jest.spyOn(logger, 'info').mockImplementation(() => undefined);
    jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    const unref = jest.fn();
    const every = jest
      .spyOn(globalThis, 'setInterval')
      .mockReturnValue({ unref } as unknown as ReturnType<typeof setInterval>);
    const failure = new Error('GitHub down');
    jest.spyOn(trackerReleasesService, 'applyRetention').mockRejectedValue(failure);

    startTrackerBuildRetention();

    expect(every).toHaveBeenCalledWith(expect.any(Function), 60 * 60 * 1000);
    expect(unref).toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith('Tracker build retention started');
    await new Promise((resolve) => setImmediate(resolve));
    expect(logger.error).toHaveBeenCalledWith(failure, 'Tracker build retention pass failed');
  });
});
