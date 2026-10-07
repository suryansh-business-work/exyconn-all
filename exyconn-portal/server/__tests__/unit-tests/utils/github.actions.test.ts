import { ConfigurationError } from '../../../src/utils/errors';
import { logger } from '../../../src/utils/logger';
import { TRACKER_WORKFLOW_FILE, githubActions } from '../../../src/utils/github';
import { REPO, active, config, json, stubGithub } from './github.fixtures';

let fetchMock: jest.SpyInstance;

beforeEach(() => {
  fetchMock = stubGithub();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('dispatchTrackerBuild', () => {
  it('posts the workflow dispatch with the token and accepts the empty 204', async () => {
    active(config);
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    await githubActions.dispatchTrackerBuild('main', { platforms: 'android' });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${REPO}/actions/workflows/${TRACKER_WORKFLOW_FILE}/dispatches`);
    expect(init.method).toBe('POST');
    expect(JSON.parse(String(init.body))).toEqual({
      ref: 'main',
      inputs: { platforms: 'android' },
    });
    expect(init.headers).toEqual({
      Authorization: `Bearer ${config.token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    });
  });

  it('refuses when no GitHub configuration is active', async () => {
    active(null);
    await expect(githubActions.dispatchTrackerBuild('main', {})).rejects.toBeInstanceOf(
      ConfigurationError,
    );
  });

  it('reports a failed call with its status and a short detail', async () => {
    active(config);
    fetchMock.mockResolvedValue(new Response('z'.repeat(250), { status: 422 }));
    await expect(githubActions.dispatchTrackerBuild('main', {})).rejects.toThrow(
      `GitHub /actions/workflows/${TRACKER_WORKFLOW_FILE}/dispatches failed (422): ${'z'.repeat(200)}`,
    );
  });
});

describe('listTrackerRuns', () => {
  it('lists runs newest first, with an empty branch when GitHub has none', async () => {
    active(config);
    fetchMock.mockResolvedValue(
      json({
        workflow_runs: [
          {
            id: 11,
            status: 'completed',
            conclusion: 'success',
            head_branch: 'main',
            html_url: 'https://github.test/run/11',
            created_at: '2026-10-02T08:00:00Z',
          },
          {
            id: 10,
            status: 'queued',
            conclusion: null,
            head_branch: null,
            html_url: 'https://github.test/run/10',
            created_at: '2026-10-01T08:00:00Z',
          },
        ],
      }),
    );
    const runs = await githubActions.listTrackerRuns(5);
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      `${REPO}/actions/workflows/${TRACKER_WORKFLOW_FILE}/runs?per_page=5`,
    );
    expect(runs).toEqual([
      {
        id: '11',
        status: 'completed',
        conclusion: 'success',
        branch: 'main',
        url: 'https://github.test/run/11',
        startedAt: new Date('2026-10-02T08:00:00Z'),
      },
      {
        id: '10',
        status: 'queued',
        conclusion: null,
        branch: '',
        url: 'https://github.test/run/10',
        startedAt: new Date('2026-10-01T08:00:00Z'),
      },
    ]);
  });

  it('answers no runs for an empty answer', async () => {
    active(config);
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    await expect(githubActions.listTrackerRuns(5)).resolves.toEqual([]);
  });
});

describe('verify', () => {
  it('reads the workflow through the given configuration and logs the repository', async () => {
    const findOne = active(null);
    const info = jest.spyOn(logger, 'info').mockImplementation(() => undefined);
    fetchMock.mockResolvedValue(json({ id: 1 }));
    await githubActions.verify(config);
    expect(findOne).not.toHaveBeenCalled();
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      `${REPO}/actions/workflows/${TRACKER_WORKFLOW_FILE}`,
    );
    expect(info).toHaveBeenCalledWith('GitHub config "Releases" reached acme/portal');
  });
});
