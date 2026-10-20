import type { GraphQLContext } from '../../middleware/auth';
import { assertPlatformStaff } from '../../lib/platformAccess';
import { PERMISSION_MODULES } from '../../lib/permissions';
import { ROLES } from '../../constants/roles';
import { runAsPlatform } from '../../lib/tenant';
import { badRequest, notFound } from '../../utils/errors';
import { githubActions } from '../../utils/github';
import { MaReleaseModel, type MaReleaseDocument } from './models';
import { getMaSettings } from './settings.service';
import {
  DOWNLOADABLE_RELEASE_STATUSES,
  RELEASE_CHANNELS,
  type ReleaseChannel,
  type ReleaseStatus,
} from './ma.enums';

export const RELEASE_PERMISSION_MODULE = 'MaExtensionRelease';
PERMISSION_MODULES.add(RELEASE_PERMISSION_MODULE);

/** Chrome's manifest version: one to four dot-separated integers, none above 65535. */
const CHROME_VERSION = /^\d{1,5}(?:\.\d{1,5}){0,3}$/;
const SHA256 = /^[\da-f]{64}$/;
const COMMIT = /^[\da-f]{7,40}$/;

type LeanRelease = MaReleaseDocument & { _id: unknown };

/** Release managers: platform staff with ADMIN. Every company sees the same releases. */
export function assertReleaseManager(ctx: GraphQLContext, action: 'VIEW' | 'EDIT' = 'EDIT') {
  return assertPlatformStaff(ctx, RELEASE_PERMISSION_MODULE, [ROLES.ADMIN], action);
}

export async function isReleaseManager(ctx: GraphQLContext): Promise<boolean> {
  try {
    await assertReleaseManager(ctx, 'VIEW');
    return true;
  } catch {
    return false;
  }
}

/** A channel sees its own builds and every steadier one: INTERNAL sees BETA and STABLE too. */
export function channelsFor(channel: ReleaseChannel): ReleaseChannel[] {
  return RELEASE_CHANNELS.slice(0, RELEASE_CHANNELS.indexOf(channel) + 1);
}

export function isDownloadable(release: Pick<MaReleaseDocument, 'status'>): boolean {
  return DOWNLOADABLE_RELEASE_STATUSES.has(release.status as ReleaseStatus);
}

/** Releases the caller may see: all of them for managers, approved ones on the company channel otherwise. */
export async function visibleReleases(ctx: GraphQLContext): Promise<LeanRelease[]> {
  if (await isReleaseManager(ctx)) {
    return runAsPlatform(() =>
      MaReleaseModel.find().sort({ builtAt: -1 }).limit(100).lean<LeanRelease[]>(),
    );
  }
  const { releaseChannel } = await getMaSettings();
  return runAsPlatform(() =>
    MaReleaseModel.find({
      channel: { $in: channelsFor(releaseChannel as ReleaseChannel) },
      status: { $in: [...DOWNLOADABLE_RELEASE_STATUSES] },
    })
      .sort({ builtAt: -1 })
      .limit(50)
      .lean<LeanRelease[]>(),
  );
}

/** A release the caller may download, or not-found. */
export async function downloadableRelease(ctx: GraphQLContext, id: string): Promise<LeanRelease> {
  const release = (await visibleReleases(ctx)).find((row) => String(row._id) === id);
  if (!release) {
    notFound('Release');
  }
  return release;
}

export interface RegisterReleaseInput {
  version: string;
  channel: ReleaseChannel;
  buildNumber: number;
  commitSha: string;
  builtAt: Date;
  artifactName: string;
  artifactSize: number;
  sha256: string;
  assetUrl: string;
  releaseUrl: string;
  buildRunUrl: string;
  releaseNotes: string;
  minChromeVersion: string;
}

async function checkRegistration(input: RegisterReleaseInput): Promise<void> {
  if (
    !CHROME_VERSION.test(input.version) ||
    input.version.split('.').some((part) => Number(part) > 65535)
  ) {
    badRequest('The version must be a Chrome extension version, e.g. 1.2.3.');
  }
  if (!SHA256.test(input.sha256.toLowerCase()) || !COMMIT.test(input.commitSha.toLowerCase())) {
    badRequest('The checksum must be a SHA-256 hex digest and the commit a git SHA.');
  }
  if (!input.artifactName.endsWith('.zip') || input.artifactSize <= 0) {
    badRequest('The artifact must be a non-empty .zip.');
  }
  if (!(await githubActions.isRepoReleaseAsset(input.assetUrl))) {
    badRequest('The artifact must be a release asset of the configured GitHub repository.');
  }
}

/**
 * Registers a build (CI calls this with an API key). Registering the same version and channel
 * again with the SAME checksum returns the existing row; with different bytes it is refused —
 * a released version is never silently replaced.
 */
export async function registerRelease(
  input: RegisterReleaseInput,
  publisherName: string,
): Promise<LeanRelease> {
  await checkRegistration(input);
  const sha256 = input.sha256.toLowerCase();
  return runAsPlatform(async () => {
    const existing = await MaReleaseModel.findOne({
      version: input.version,
      channel: input.channel,
    }).lean<LeanRelease>();
    if (existing) {
      if (existing.sha256 !== sha256) {
        badRequest(
          `Version ${input.version} (${input.channel}) is already registered with different bytes. Bump the version.`,
        );
      }
      return existing;
    }
    const created = await MaReleaseModel.create({
      ...input,
      sha256,
      commitSha: input.commitSha.toLowerCase(),
      status: 'QA_PENDING',
      publisherName,
      statusHistory: [
        {
          status: 'QA_PENDING',
          at: new Date(),
          byName: publisherName,
          note: 'Registered by the build',
        },
      ],
    });
    return created.toObject() as LeanRelease;
  });
}

/** Statuses a release may move to from each status: the release flow, and nothing skipped past review. */
const NEXT: Record<ReleaseStatus, ReleaseStatus[]> = {
  DRAFT: ['BUILDING', 'DEPRECATED'],
  BUILDING: ['BUILD_FAILED', 'QA_PENDING'],
  BUILD_FAILED: ['DEPRECATED'],
  QA_PENDING: ['READY_FOR_INTERNAL_TESTING', 'DEPRECATED'],
  READY_FOR_INTERNAL_TESTING: ['INTERNAL_RELEASED', 'QA_PENDING', 'DEPRECATED'],
  INTERNAL_RELEASED: ['READY_FOR_STORE_SUBMISSION', 'DEPRECATED'],
  READY_FOR_STORE_SUBMISSION: ['SUBMITTED_FOR_REVIEW', 'DEPRECATED'],
  SUBMITTED_FOR_REVIEW: ['IN_REVIEW', 'PUBLISHED', 'REJECTED'],
  IN_REVIEW: ['PUBLISHED', 'REJECTED'],
  PUBLISHED: ['DEPRECATED'],
  REJECTED: ['READY_FOR_STORE_SUBMISSION', 'DEPRECATED'],
  DEPRECATED: [],
};

export interface ReleaseStatusInput {
  status: ReleaseStatus;
  note: string;
  storeItemId?: string | null;
  storeUrl?: string | null;
}

/** Moves a release on, recording who and why. PUBLISHED needs the store listing it is published at. */
export function setReleaseStatus(
  id: string,
  input: ReleaseStatusInput,
  byName: string,
): Promise<LeanRelease> {
  return runAsPlatform(async () => {
    const release = await MaReleaseModel.findById(id);
    if (!release) {
      notFound('Release');
    }
    if (!NEXT[release.status as ReleaseStatus].includes(input.status)) {
      badRequest(`A release cannot move from ${release.status} to ${input.status}.`);
    }
    const storeUrl = input.storeUrl?.trim() ?? release.storeUrl;
    if (
      input.status === 'PUBLISHED' &&
      !storeUrl.startsWith('https://chromewebstore.google.com/')
    ) {
      badRequest('Publishing needs the Chrome Web Store listing URL the store confirmed.');
    }
    release.status = input.status;
    release.storeUrl = storeUrl;
    release.storeItemId = input.storeItemId?.trim() ?? release.storeItemId;
    release.statusHistory.push({
      status: input.status,
      at: new Date(),
      byName,
      note: input.note.trim().slice(0, 500),
    });
    await release.save();
    return release.toObject() as LeanRelease;
  });
}

/** Opens the release's bytes on GitHub and counts the download. */
export async function openReleaseArtifact(id: string) {
  const release = await runAsPlatform(() => MaReleaseModel.findById(id).lean<LeanRelease>());
  if (!release) {
    notFound('Release');
  }
  const response = await githubActions.openReleaseAsset(release.assetUrl);
  await runAsPlatform(() =>
    MaReleaseModel.updateOne({ _id: release._id }, { $inc: { downloadCount: 1 } }),
  );
  return { release, response };
}
