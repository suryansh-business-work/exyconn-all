import express from 'express';
import request from 'supertest';
import { githubActions } from '../../../../src/utils/github';
import { logger } from '../../../../src/utils/logger';
import {
  TRACKER_UPDATES_PATH,
  resetTrackerUpdatesCache,
  trackerUpdatesRouter,
} from '../../../../src/modules/tracker/tracker.updates';

const RELEASE = 'https://github.test/exyconn/releases/download';
const START = Date.UTC(2026, 9, 1, 9, 0, 0);

function app() {
  const server = express();
  server.use(TRACKER_UPDATES_PATH, trackerUpdatesRouter());
  return server;
}

const files = (version: string) =>
  new Map([['latest.yml', `${RELEASE}/tracker-v${version}/latest.yml`]]);

describe('the tracker update feed cache', () => {
  beforeEach(() => {
    resetTrackerUpdatesCache();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('asks GitHub again once the cached lookup is a minute old', async () => {
    const now = jest.spyOn(Date, 'now').mockReturnValue(START);
    const lookup = jest
      .spyOn(githubActions, 'latestTrackerReleaseFiles')
      .mockResolvedValueOnce(files('2.0.0'))
      .mockResolvedValueOnce(files('2.1.0'));
    const server = app();

    const first = await request(server).get(`${TRACKER_UPDATES_PATH}/latest.yml`);
    now.mockReturnValue(START + 59_999);
    const cached = await request(server).get(`${TRACKER_UPDATES_PATH}/latest.yml`);
    now.mockReturnValue(START + 60_000);
    const refreshed = await request(server).get(`${TRACKER_UPDATES_PATH}/latest.yml`);

    expect(first.headers.location).toBe(`${RELEASE}/tracker-v2.0.0/latest.yml`);
    expect(cached.headers.location).toBe(`${RELEASE}/tracker-v2.0.0/latest.yml`);
    expect(refreshed.headers.location).toBe(`${RELEASE}/tracker-v2.1.0/latest.yml`);
    expect(lookup).toHaveBeenCalledTimes(2);
  });

  it('forgets the cached release when told to, so a new build is picked up at once', async () => {
    const lookup = jest
      .spyOn(githubActions, 'latestTrackerReleaseFiles')
      .mockResolvedValueOnce(files('2.0.0'))
      .mockResolvedValueOnce(files('2.2.0'));
    const server = app();

    await request(server).get(`${TRACKER_UPDATES_PATH}/latest.yml`);
    resetTrackerUpdatesCache();
    const response = await request(server).get(`${TRACKER_UPDATES_PATH}/latest.yml`);

    expect(response.headers.location).toBe(`${RELEASE}/tracker-v2.2.0/latest.yml`);
    expect(lookup).toHaveBeenCalledTimes(2);
  });

  it('logs which file the updater asked for when the feed fails', async () => {
    const failure = new Error('rate limited');
    jest.spyOn(githubActions, 'latestTrackerReleaseFiles').mockRejectedValue(failure);
    const logged = jest.spyOn(logger, 'error').mockImplementation(() => undefined);

    const response = await request(app()).get(`${TRACKER_UPDATES_PATH}/latest.yml`);

    expect(response.status).toBe(502);
    expect(response.body).toEqual({ error: 'The update feed is unavailable.' });
    expect(logged).toHaveBeenCalledWith(
      { err: failure, file: 'latest.yml' },
      'Tracker update feed unavailable',
    );
  });

  it('names the missing file in a 404', async () => {
    jest.spyOn(githubActions, 'latestTrackerReleaseFiles').mockResolvedValue(files('2.0.0'));

    const response = await request(app()).get(`${TRACKER_UPDATES_PATH}/latest-linux.yml`);

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('No latest-linux.yml on a recent tracker release.');
  });
});
