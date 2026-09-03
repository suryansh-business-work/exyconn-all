import { GithubConfigModel, type GithubConfigDocument } from '../modules/tech/github-config.model';
import { logger } from './logger';

const GITHUB_API_URL = 'https://api.github.com';

/** The workflow that builds and publishes the desktop tracker installers. */
export const TRACKER_WORKFLOW_FILE = 'tracker-release.yml';

/** One run of the tracker build workflow, as the portal shows it. */
export interface WorkflowRun {
  id: string;
  status: string;
  conclusion: string | null;
  branch: string;
  url: string;
  startedAt: Date;
}

interface RunPayload {
  id: number;
  status: string;
  conclusion: string | null;
  head_branch: string | null;
  html_url: string;
  created_at: string;
}

/**
 * Starts and reports on GitHub Actions runs (singleton). The repository and its
 * token come from the active GitHub config in the Tech module's Environment
 * Variables screen, so rotating the token never needs a redeploy.
 */
class GithubActions {
  private async request<T>(
    config: GithubConfigDocument,
    path: string,
    init: RequestInit = {},
  ): Promise<T | null> {
    const response = await fetch(`${GITHUB_API_URL}/repos/${config.owner}/${config.repo}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`GitHub ${path} failed (${response.status}): ${detail.slice(0, 200)}`);
    }
    // A workflow dispatch answers 204 with an empty body.
    if (response.status === 204) {
      return null;
    }
    return (await response.json()) as T;
  }

  /** Loads the single active GitHub config, or throws. */
  private async getActiveConfig(): Promise<GithubConfigDocument> {
    const config = await GithubConfigModel.findOne({ isActive: true }).lean();
    if (!config) {
      throw new Error('No active GitHub configuration. Add one in Tech › Environment Variables.');
    }
    return config;
  }

  /** Asks GitHub to run the tracker workflow with the given inputs. */
  async dispatchTrackerBuild(ref: string, inputs: Record<string, string>): Promise<void> {
    const config = await this.getActiveConfig();
    await this.request(config, `/actions/workflows/${TRACKER_WORKFLOW_FILE}/dispatches`, {
      method: 'POST',
      body: JSON.stringify({ ref, inputs }),
    });
    logger.info({ inputs }, `Tracker build dispatched on ${ref}`);
  }

  /** The most recent runs of the tracker workflow, newest first. */
  async listTrackerRuns(limit: number): Promise<WorkflowRun[]> {
    const config = await this.getActiveConfig();
    const payload = await this.request<{ workflow_runs: RunPayload[] }>(
      config,
      `/actions/workflows/${TRACKER_WORKFLOW_FILE}/runs?per_page=${limit}`,
    );
    return (payload?.workflow_runs ?? []).map((run) => ({
      id: String(run.id),
      status: run.status,
      conclusion: run.conclusion,
      branch: run.head_branch ?? '',
      url: run.html_url,
      startedAt: new Date(run.created_at),
    }));
  }

  /**
   * Reads the repository through an explicit config (not necessarily the active
   * one) so an admin can validate the token and repo before activating.
   */
  async verify(config: GithubConfigDocument): Promise<void> {
    await this.request(config, `/actions/workflows/${TRACKER_WORKFLOW_FILE}`);
    logger.info(`GitHub config "${config.label}" reached ${config.owner}/${config.repo}`);
  }
}

export const githubActions = new GithubActions();
