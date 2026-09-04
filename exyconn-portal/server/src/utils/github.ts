import { GithubConfigModel, type GithubConfigDocument } from '../modules/tech/github-config.model';
import { logger } from './logger';

const GITHUB_API_URL = 'https://api.github.com';

/** How many recent releases to scan for the newest one carrying tracker installers. */
const RELEASE_SCAN = 20;

/** The workflow that builds and publishes the desktop tracker installers. */
export const TRACKER_WORKFLOW_FILE = 'tracker-release.yml';

/** Every tracker installer release is tagged `tracker-v<version>` by that workflow. */
export const TRACKER_TAG_PREFIX = 'tracker-v';

/** Installer file extension -> the platform it installs on. */
const ASSET_PLATFORMS = new Map<string, string>([
  ['.exe', 'windows'],
  ['.dmg', 'macos'],
  ['.appimage', 'linux'],
]);

/**
 * The platform an installer file belongs to, or null for anything else the release
 * carries (checksums, blockmaps, update manifests) — those are not downloadable builds.
 */
export function trackerAssetPlatform(fileName: string): string | null {
  const dot = fileName.lastIndexOf('.');
  if (dot < 0) return null;
  return ASSET_PLATFORMS.get(fileName.slice(dot).toLowerCase()) ?? null;
}

/** One installer file on a tracker release. */
export interface ReleaseAsset {
  name: string;
  platform: string;
  sizeBytes: number;
  downloadCount: number;
  url: string;
}

/** A published tracker release, as the portal's Download page shows it. */
export interface TrackerRelease {
  version: string;
  tag: string;
  name: string;
  notes: string;
  url: string;
  publishedAt: Date;
  assets: ReleaseAsset[];
}

interface ReleasePayload {
  tag_name: string;
  name: string | null;
  body: string | null;
  html_url: string;
  draft: boolean;
  prerelease: boolean;
  published_at: string | null;
  created_at: string;
  assets: {
    name: string;
    size: number;
    download_count: number;
    browser_download_url: string;
  }[];
}

/** Reshapes a GitHub release payload into the portal's own release type. */
export function toTrackerRelease(release: ReleasePayload): TrackerRelease {
  const assets = release.assets
    .map((asset) => ({
      name: asset.name,
      platform: trackerAssetPlatform(asset.name),
      sizeBytes: asset.size,
      downloadCount: asset.download_count,
      url: asset.browser_download_url,
    }))
    .filter((asset): asset is ReleaseAsset => asset.platform !== null);

  return {
    version: release.tag_name.slice(TRACKER_TAG_PREFIX.length),
    tag: release.tag_name,
    name: release.name ?? release.tag_name,
    notes: release.body ?? '',
    url: release.html_url,
    publishedAt: new Date(release.published_at ?? release.created_at),
    assets,
  };
}

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
   * The newest published tracker release that actually carries installers.
   *
   * `/releases/latest` is not usable here: the repository releases more than the
   * tracker, so the latest release may well be somebody else's. This walks the
   * release list newest-first and takes the first published `tracker-v*` tag.
   */
  async latestTrackerRelease(): Promise<TrackerRelease | null> {
    const config = await this.getActiveConfig();
    const payload = await this.request<ReleasePayload[]>(
      config,
      `/releases?per_page=${RELEASE_SCAN}`,
    );
    const release = (payload ?? [])
      .filter((entry) => !entry.draft && entry.tag_name.startsWith(TRACKER_TAG_PREFIX))
      .map(toTrackerRelease)
      .find((entry) => entry.assets.length > 0);
    return release ?? null;
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
