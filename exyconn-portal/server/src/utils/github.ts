import { GithubConfigModel, type GithubConfigDocument } from '../modules/tech/github-config.model';
import { logger } from './logger';

const GITHUB_API_URL = 'https://api.github.com';

/** How many recent releases to scan for the newest one carrying tracker installers. */
const RELEASE_SCAN = 20;

/** The workflow that builds and publishes the tracker installers, desktop and mobile. */
export const TRACKER_WORKFLOW_FILE = 'tracker-release.yml';

/** Every tracker installer release is tagged `tracker-v<version>` by that workflow. */
export const TRACKER_TAG_PREFIX = 'tracker-v';

/**
 * Installer file extension -> the platform it installs on. An Android build also produces an
 * `.aab`, but that is a Play Store upload bundle nobody can install, so it is not listed.
 */
const ASSET_PLATFORMS = new Map<string, string>([
  ['.exe', 'windows'],
  ['.dmg', 'macos'],
  ['.appimage', 'linux'],
  ['.apk', 'android'],
  // The Play Store bundle is offered beside the APK: the APK installs on a phone, the AAB is
  // what an administrator uploads to the Play Console.
  ['.aab', 'android'],
  ['.ipa', 'ios'],
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
  /** The version of the release this file is on — not always the release around it. */
  version: string;
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

/** Whether a release carries an installer for the given platform. */
function hasInstallerFor(release: ReleasePayload, platform: string): boolean {
  return release.assets.some((asset) => trackerAssetPlatform(asset.name) === platform);
}

/** Reshapes a GitHub release payload into the portal's own release type. */
export function toTrackerRelease(release: ReleasePayload): TrackerRelease {
  const version = release.tag_name.slice(TRACKER_TAG_PREFIX.length);
  const assets = release.assets
    .map((asset) => ({
      name: asset.name,
      platform: trackerAssetPlatform(asset.name),
      version,
      sizeBytes: asset.size,
      downloadCount: asset.download_count,
      url: asset.browser_download_url,
    }))
    .filter((asset): asset is ReleaseAsset => asset.platform !== null);

  return {
    version,
    tag: release.tag_name,
    name: release.name ?? release.tag_name,
    notes: release.body ?? '',
    url: release.html_url,
    publishedAt: new Date(release.published_at ?? release.created_at),
    assets,
  };
}

/**
 * The newest release, carrying for EVERY platform the installers of the newest release that has
 * one. A build can be run for a subset of platforms, so a phone-only release must not make the
 * desktop installers vanish from the Download page; each asset keeps its own `version`.
 */
export function mergeNewestPerPlatform(releases: readonly ReleasePayload[]): TrackerRelease | null {
  if (releases.length === 0) {
    return null;
  }
  const claimed = new Set<string>();
  const assets: ReleaseAsset[] = [];
  for (const release of releases) {
    const found = toTrackerRelease(release).assets.filter((asset) => !claimed.has(asset.platform));
    assets.push(...found);
    for (const asset of found) {
      claimed.add(asset.platform);
    }
  }
  return { ...toTrackerRelease(releases[0]), assets };
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
   * The newest tracker release, as the portal's Download page shows it: every platform's
   * newest installers (see {@link mergeNewestPerPlatform}).
   *
   * With a `platform` (e.g. `android`), the newest release carrying an installer for that
   * platform — what an app's own update check compares its version against.
   */
  async latestTrackerRelease(platform?: string | null): Promise<TrackerRelease | null> {
    const releases = await this.listTrackerReleases();
    if (!platform) {
      return mergeNewestPerPlatform(releases);
    }
    const release = releases.find((entry) => hasInstallerFor(entry, platform));
    return release ? toTrackerRelease(release) : null;
  }

  /**
   * Every file the tracker releases carry, keyed by file name, each resolved to the NEWEST
   * release that has a file of that name.
   *
   * Unlike {@link latestTrackerRelease} this keeps the files the Download page has no use
   * for — `latest.yml` and the `.blockmap`s — because they are exactly what the desktop
   * app's updater reads. See the /tracker-updates route that serves them.
   *
   * Merged across releases rather than read off the newest one: a build can be run for a
   * subset of platforms, and a release holding only an `.apk` must not hide the macOS
   * updater's `latest-mac.yml` on the release before it.
   */
  async latestTrackerReleaseFiles(): Promise<Map<string, string>> {
    const files = new Map<string, string>();
    for (const release of await this.listTrackerReleases()) {
      for (const asset of release.assets) {
        if (!files.has(asset.name)) {
          files.set(asset.name, asset.browser_download_url);
        }
      }
    }
    return files;
  }

  /**
   * The published `tracker-v*` releases that actually carry installers, newest first.
   *
   * `/releases/latest` is not usable here: the repository releases more than the tracker,
   * so the latest release may well be somebody else's. This walks the release list
   * newest-first and keeps the published tracker tags.
   */
  private async listTrackerReleases(): Promise<ReleasePayload[]> {
    const config = await this.getActiveConfig();
    const payload = await this.request<ReleasePayload[]>(
      config,
      `/releases?per_page=${RELEASE_SCAN}`,
    );
    return (payload ?? []).filter(
      (entry) =>
        !entry.draft &&
        entry.tag_name.startsWith(TRACKER_TAG_PREFIX) &&
        entry.assets.some((asset) => trackerAssetPlatform(asset.name) !== null),
    );
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
