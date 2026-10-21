import { createHash } from 'node:crypto';
import express, { type Request, type Response, type Router } from 'express';
import { env } from '../../config/env';
import { createLimiter } from '../../lib/rateLimiter';
import { platformOperatorOrganizationId } from '../../lib/platformAccess';
import { runForOrganization } from '../../lib/tenant';
import { logger } from '../../utils/logger';
import { OidcRefusal, verifyGithubOidc, type GithubRunClaims } from '../../utils/githubOidc';
import { recordSystemAudit } from '../audit';
import { RELEASE_CHANNELS, type ReleaseChannel } from './ma.enums';
import { announceNewBuild } from './releases.notify';
import { checkRegistration, registerRelease, releaseByVersion } from './releases.service';
import { getReleaseSettings } from './releases.settings';
import { deleteReleaseZip, saveReleaseZip } from './releases.store';

/** Where CI uploads a build, under the assistant's REST path. */
export const RELEASE_UPLOAD_PATH = '/releases/upload';

/** The largest ZIP accepted (a build is ~0.5 MB); under nginx's 15 MB body limit. */
export const MAX_RELEASE_ZIP_BYTES = 10 * 1024 * 1024;
const BODY_LIMIT = '11mb';
const MAX_NOTES = 2000;
const ZIP_MAGIC = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
const DUPLICATE_KEY = 11000;

/** Only the release workflow, on main, may upload. */
const WORKFLOW_PATH = '.github/workflows/meet-extension-release.yml';
const MAIN_REF = 'refs/heads/main';

const uploadLimiter = createLimiter({
  keyPrefix: 'ma-release-upload',
  points: 10,
  durationSec: 3600,
});

/** A refused upload, with the HTTP status CI sees. */
class UploadRefusal extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/** The build's own description of itself: the `release.json` that `pnpm package` writes. */
interface BuildManifest {
  version: string;
  builtAt: string;
  minChromeVersion?: string;
  releaseChannel?: string;
  files: { name: string; size: number; sha256: string; channel: string }[];
}

interface Upload {
  build: BuildManifest;
  internal: BuildManifest['files'][number];
  zip: Buffer;
  notes: string;
}

function parseManifest(text: string): BuildManifest {
  try {
    return JSON.parse(text) as BuildManifest;
  } catch {
    throw new UploadRefusal(400, 'release.json is not valid JSON.');
  }
}

/** The multipart body: `release` (release.json), `file` (the internal ZIP) and `notes`. */
async function readUpload(req: Request): Promise<Upload> {
  // express.raw only reads a multipart body; anything else leaves no Buffer here.
  if (!Buffer.isBuffer(req.body)) {
    throw new UploadRefusal(400, 'Send a multipart/form-data body.');
  }
  const form = await new globalThis.Request('http://upload.local', {
    method: 'POST',
    headers: { 'content-type': String(req.headers['content-type'] ?? '') },
    body: Uint8Array.from(req.body),
  })
    .formData()
    .catch(() => {
      throw new UploadRefusal(400, 'Send a multipart/form-data body.');
    });
  const file = form.get('file');
  const manifest = form.get('release');
  if (!(file instanceof Blob) || typeof manifest !== 'string') {
    throw new UploadRefusal(400, 'Send the ZIP as "file" and release.json as "release".');
  }
  const build = parseManifest(manifest);
  const internal = build.files?.find((entry) => entry.channel === 'internal');
  if (!internal || (file as File).name !== internal.name) {
    throw new UploadRefusal(400, 'The file is not the internal ZIP release.json describes.');
  }
  const notes = form.get('notes');
  return {
    build,
    internal,
    zip: Buffer.from(await file.arrayBuffer()),
    notes: typeof notes === 'string' ? notes.slice(0, MAX_NOTES) : '',
  };
}

/** The ZIP is a ZIP, within the cap, and exactly the bytes release.json names. */
function checkZip({ zip, internal }: Upload): void {
  if (zip.length > MAX_RELEASE_ZIP_BYTES) {
    throw new UploadRefusal(413, 'The ZIP is larger than 10 MB.');
  }
  if (zip.length !== internal.size || !zip.subarray(0, 4).equals(ZIP_MAGIC)) {
    throw new UploadRefusal(400, 'The file is not the ZIP release.json describes.');
  }
  if (createHash('sha256').update(zip).digest('hex') !== internal.sha256.toLowerCase()) {
    throw new UploadRefusal(400, 'The ZIP does not match its SHA-256 checksum.');
  }
}

function registration(upload: Upload, claims: GithubRunClaims) {
  const channel: ReleaseChannel =
    RELEASE_CHANNELS.find((one) => one === upload.build.releaseChannel) ?? 'INTERNAL';
  return {
    version: upload.build.version,
    channel,
    buildNumber: Number.parseInt(claims.run_number, 10),
    commitSha: claims.sha,
    builtAt: new Date(upload.build.builtAt),
    artifactName: upload.internal.name,
    artifactSize: upload.internal.size,
    sha256: upload.internal.sha256,
    buildRunUrl: `https://github.com/${claims.repository}/actions/runs/${claims.run_id}`,
    releaseNotes: upload.notes,
    minChromeVersion: upload.build.minChromeVersion ?? '116',
  };
}

/** Stores and registers the build; an upload of a version already stored is refused. */
async function storeUpload(upload: Upload, claims: GithubRunClaims) {
  const existing = await releaseByVersion(upload.build.version);
  if (existing?.sha256 === upload.internal.sha256.toLowerCase()) {
    return { release: existing, created: false };
  }
  if (existing) {
    throw new UploadRefusal(409, `Version ${upload.build.version} is already stored.`);
  }
  const input = registration(upload, claims);
  try {
    checkRegistration(input);
  } catch (error) {
    throw new UploadRefusal(400, (error as Error).message);
  }
  const fileId = await saveReleaseZip(input.artifactName, upload.zip, {
    version: input.version,
    sha256: input.sha256,
  });
  try {
    const note = `Uploaded by run ${claims.run_id} (${claims.event_name}) at ${claims.sha.slice(0, 7)}`;
    const release = await registerRelease(
      { ...input, fileId },
      `GitHub Actions (${claims.actor})`,
      note,
    );
    return { release, created: true };
  } catch (error) {
    await deleteReleaseZip(fileId);
    if ((error as { code?: number }).code === DUPLICATE_KEY) {
      throw new UploadRefusal(409, `Version ${upload.build.version} is already stored.`);
    }
    throw error;
  }
}

/** Records the upload in the operator company's audit log. */
async function auditUpload(version: string, claims: GithubRunClaims): Promise<void> {
  const operatorId = await platformOperatorOrganizationId();
  if (!operatorId) {
    logger.warn({ version }, 'No operator company to audit the extension upload in');
    return;
  }
  await runForOrganization(operatorId, () =>
    recordSystemAudit({
      action: 'IMPORT',
      module: 'MaExtensionRelease',
      entityLabel: version,
      summary: `CI uploaded Meeting Assistant build ${version} from ${claims.repository} run ${claims.run_id}`,
    }),
  );
}

async function uploadEndpoint(req: Request, res: Response): Promise<void> {
  if (!(await uploadLimiter.allow(req.ip ?? 'unknown'))) {
    res.status(429).json({ error: 'Too many uploads. Try again later.' });
    return;
  }
  const header = req.headers.authorization ?? '';
  const settings = await getReleaseSettings();
  const claims = await verifyGithubOidc(header.startsWith('Bearer ') ? header.slice(7) : '', {
    audience: env.apiPublicUrl,
    repository: settings.allowedRepository,
    ref: MAIN_REF,
    workflowPath: WORKFLOW_PATH,
  });
  const upload = await readUpload(req);
  checkZip(upload);
  const { release, created } = await storeUpload(upload, claims);
  if (created) {
    await auditUpload(release.version, claims);
    announceNewBuild(release);
  }
  logger.info({ version: release.version, created }, 'Extension build uploaded');
  res
    .status(created ? 201 : 200)
    .json({ version: release.version, status: release.status, created });
}

function refuse(error: unknown, res: Response): void {
  if (error instanceof OidcRefusal) {
    logger.warn({ err: error }, 'Extension upload refused: OIDC');
    res.status(401).json({ error: error.message });
    return;
  }
  if (error instanceof UploadRefusal) {
    logger.warn({ err: error }, 'Extension upload refused');
    res.status(error.status).json({ error: error.message });
    return;
  }
  logger.error({ err: error }, 'Extension upload failed');
  res.status(500).json({ error: 'The upload failed on the server.' });
}

/** Adds CI's build upload (GitHub Actions OIDC, multipart) to the assistant's router. */
export function addReleaseUploadRoute(router: Router): void {
  const raw = express.raw({ type: 'multipart/form-data', limit: BODY_LIMIT });
  router.post(RELEASE_UPLOAD_PATH, raw, (req, res) => {
    uploadEndpoint(req, res).catch((error: unknown) => refuse(error, res));
  });
}
