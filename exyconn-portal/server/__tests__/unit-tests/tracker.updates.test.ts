import express from 'express';
import request from 'supertest';
import { githubActions } from '../../src/utils/github';
import {
  TRACKER_UPDATES_PATH,
  resetTrackerUpdatesCache,
  trackerUpdatesRouter,
} from '../../src/modules/tracker/tracker.updates';

const DOWNLOAD_HOST = 'https://github.test/exyconn/releases/download/tracker-v2.0.0';

function app() {
  const server = express();
  server.use(TRACKER_UPDATES_PATH, trackerUpdatesRouter());
  return server;
}

function releaseFiles() {
  return new Map([
    ['latest.yml', `${DOWNLOAD_HOST}/latest.yml`],
    ['Exyconn.Tracker-Setup-2.0.0.exe', `${DOWNLOAD_HOST}/Exyconn.Tracker-Setup-2.0.0.exe`],
  ]);
}

describe('the desktop tracker update feed', () => {
  beforeEach(() => {
    resetTrackerUpdatesCache();
  });

  it('redirects the updater to the file on the latest release', async () => {
    jest.spyOn(githubActions, 'latestTrackerReleaseFiles').mockResolvedValue(releaseFiles());

    const response = await request(app()).get(`${TRACKER_UPDATES_PATH}/latest.yml`);

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe(`${DOWNLOAD_HOST}/latest.yml`);
  });

  it('reuses one release lookup across the fleet polling it', async () => {
    const lookup = jest
      .spyOn(githubActions, 'latestTrackerReleaseFiles')
      .mockResolvedValue(releaseFiles());
    const server = app();

    await request(server).get(`${TRACKER_UPDATES_PATH}/latest.yml`);
    await request(server).get(`${TRACKER_UPDATES_PATH}/Exyconn.Tracker-Setup-2.0.0.exe`);

    expect(lookup).toHaveBeenCalledTimes(1);
  });

  it('404s a file the release does not carry', async () => {
    jest.spyOn(githubActions, 'latestTrackerReleaseFiles').mockResolvedValue(releaseFiles());

    const response = await request(app()).get(`${TRACKER_UPDATES_PATH}/latest-mac.yml`);

    expect(response.status).toBe(404);
  });

  it('refuses anything that is not a plain file name', async () => {
    const lookup = jest.spyOn(githubActions, 'latestTrackerReleaseFiles');

    const response = await request(app()).get(`${TRACKER_UPDATES_PATH}/..%2F..%2Fetc%2Fpasswd`);

    expect(response.status).toBe(400);
    expect(lookup).not.toHaveBeenCalled();
  });

  it('answers 502 when GitHub cannot be reached, rather than hanging the updater', async () => {
    jest
      .spyOn(githubActions, 'latestTrackerReleaseFiles')
      .mockRejectedValue(new Error('GitHub is down'));

    const response = await request(app()).get(`${TRACKER_UPDATES_PATH}/latest.yml`);

    expect(response.status).toBe(502);
  });
});
