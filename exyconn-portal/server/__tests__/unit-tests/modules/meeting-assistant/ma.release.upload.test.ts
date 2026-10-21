import { createHash } from 'node:crypto';
import { Writable } from 'node:stream';
import { Types } from 'mongoose';
import express from 'express';
import request from 'supertest';
import { useTestOrganization } from '../../../helpers';
import { MA_REST_PATH, meetAssistantRouter } from '../../../../src/modules/meeting-assistant';
import {
  MAX_RELEASE_ZIP_BYTES,
  RELEASE_UPLOAD_PATH,
} from '../../../../src/modules/meeting-assistant/releases.upload';
import { announceNewBuild } from '../../../../src/modules/meeting-assistant/releases.notify';
import * as releaseService from '../../../../src/modules/meeting-assistant/releases.service';
import * as releaseStore from '../../../../src/modules/meeting-assistant/releases.store';
import {
  MaReleaseModel,
  MaReleaseSettingsModel,
} from '../../../../src/modules/meeting-assistant/models';
import { AuditLogModel } from '../../../../src/modules/audit';
import { OrganizationModel } from '../../../../src/modules/organizations';
import { invalidatePlatformOperatorCache } from '../../../../src/lib/platformAccess';
import { runAsPlatform } from '../../../../src/lib/tenant';
import { env } from '../../../../src/config/env';
import { logger } from '../../../../src/utils/logger';
import {
  OidcRefusal,
  verifyGithubOidc,
  type GithubRunClaims,
} from '../../../../src/utils/githubOidc';

jest.mock('../../../../src/utils/githubOidc', () => ({
  ...jest.requireActual('../../../../src/utils/githubOidc'),
  verifyGithubOidc: jest.fn(),
}));
jest.mock('../../../../src/modules/meeting-assistant/releases.notify', () => ({
  announceNewBuild: jest.fn(),
}));

const verify = verifyGithubOidc as jest.Mock;
const organizationId = useTestOrganization();

const app = express();
app.use(MA_REST_PATH, meetAssistantRouter());

const CLAIMS: GithubRunClaims = {
  repository: 'acme/portal',
  ref: 'refs/heads/main',
  event_name: 'push',
  workflow_ref: 'acme/portal/.github/workflows/meet-extension-release.yml@refs/heads/main',
  sha: 'abcdef1234567890abcdef1234567890abcdef12',
  run_id: '987',
  run_number: '45',
  actor: 'octocat',
};

/** A tiny ZIP: the local-file magic and some bytes. */
const zipOf = (fill = 1, size = 64) =>
  Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.alloc(size - 4, fill)]);
const sha = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');

/** release.json as `pnpm package` writes it, describing `zip`. */
const manifestOf = (zip: Buffer, patch: Record<string, unknown> = {}) => ({
  version: '1.4.0.45',
  builtAt: '2026-10-21T08:00:00.000Z',
  minChromeVersion: '120',
  releaseChannel: 'BETA',
  files: [
    { name: 'meet-1.4.0.45-store.zip', size: 10, sha256: 'f'.repeat(64), channel: 'store' },
    { name: 'meet-1.4.0.45-internal.zip', size: zip.length, sha256: sha(zip), channel: 'internal' },
  ],
  ...patch,
});

interface UploadParts {
  zip?: Buffer;
  manifest?: unknown;
  fileName?: string;
  notes?: string;
  token?: string | null;
}

function upload({
  zip = zipOf(),
  manifest = manifestOf(zip),
  fileName = 'meet-1.4.0.45-internal.zip',
  notes = 'Faster transcripts',
  token = 'oidc-token',
}: UploadParts = {}) {
  const call = request(app)
    .post(`${MA_REST_PATH}${RELEASE_UPLOAD_PATH}`)
    .field('release', typeof manifest === 'string' ? manifest : JSON.stringify(manifest))
    .field('notes', notes)
    .attach('file', zip, fileName);
  return token === null ? call : call.set('Authorization', `Bearer ${token}`);
}

beforeEach(async () => {
  verify.mockResolvedValue(CLAIMS);
  await runAsPlatform(() =>
    OrganizationModel.updateOne({ _id: organizationId }, { $set: { isPlatformOperator: true } }),
  );
  invalidatePlatformOperatorCache();
  await runAsPlatform(() => MaReleaseModel.init());
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('POST /releases/upload', () => {
  it('stores and registers the internal ZIP as waiting for QA, audited and announced', async () => {
    await runAsPlatform(() =>
      MaReleaseSettingsModel.create({ key: 'global', allowedRepository: 'acme/portal' }),
    );
    const zip = zipOf();

    const response = await upload({ zip });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ version: '1.4.0.45', status: 'QA_PENDING', created: true });
    expect(verify).toHaveBeenCalledWith('oidc-token', {
      audience: env.apiPublicUrl,
      repository: 'acme/portal',
      ref: 'refs/heads/main',
      workflowPath: '.github/workflows/meet-extension-release.yml',
    });
    const stored = await releaseService.releaseByVersion('1.4.0.45');
    expect(stored).toMatchObject({
      channel: 'BETA',
      buildNumber: 45,
      commitSha: CLAIMS.sha,
      artifactName: 'meet-1.4.0.45-internal.zip',
      artifactSize: zip.length,
      sha256: sha(zip),
      buildRunUrl: 'https://github.com/acme/portal/actions/runs/987',
      releaseNotes: 'Faster transcripts',
      minChromeVersion: '120',
      publisherName: 'GitHub Actions (octocat)',
    });
    expect(stored?.statusHistory[0].note).toBe('Uploaded by run 987 (push) at abcdef1');
    const chunks: Buffer[] = [];
    await releaseStore.streamReleaseZip(
      stored?.fileId as Types.ObjectId,
      new Writable({
        write(chunk: Buffer, _encoding, done) {
          chunks.push(chunk);
          done();
        },
      }),
    );
    expect(Buffer.concat(chunks)).toEqual(zip);
    const audit = await runAsPlatform(() =>
      AuditLogModel.findOne({ module: 'MaExtensionRelease' })
        .where('organizationId', organizationId)
        .lean(),
    );
    expect(audit).toMatchObject({ action: 'IMPORT', entityLabel: '1.4.0.45' });
    expect(announceNewBuild).toHaveBeenCalledWith(
      expect.objectContaining({ version: '1.4.0.45' }),
    );
  });

  it('answers a re-upload of the same bytes with the stored build, and refuses other bytes', async () => {
    await upload();

    const again = await upload();
    const otherZip = zipOf(2);
    const other = await upload({ zip: otherZip });

    expect(again.status).toBe(200);
    expect(again.body).toEqual({ version: '1.4.0.45', status: 'QA_PENDING', created: false });
    expect(other.status).toBe(409);
    expect(other.body.error).toBe('Version 1.4.0.45 is already stored.');
    expect(await runAsPlatform(() => MaReleaseModel.countDocuments())).toBe(1);
    expect(announceNewBuild).toHaveBeenCalledTimes(1);
  });

  it('removes the stored ZIP and answers 409 when a concurrent upload registered the version first', async () => {
    const duplicate = Object.assign(new Error('E11000 duplicate key'), { code: 11000 });
    jest.spyOn(releaseService, 'registerRelease').mockRejectedValueOnce(duplicate);
    const removed = jest.spyOn(releaseStore, 'deleteReleaseZip');

    const response = await upload();

    expect(response.status).toBe(409);
    expect(removed).toHaveBeenCalledTimes(1);
  });

  it('removes the stored ZIP and answers 500 when registering fails otherwise', async () => {
    jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    jest.spyOn(releaseService, 'registerRelease').mockRejectedValueOnce(new Error('db down'));
    const removed = jest.spyOn(releaseStore, 'deleteReleaseZip');

    const response = await upload();

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'The upload failed on the server.' });
    expect(removed).toHaveBeenCalledTimes(1);
  });

  it('answers 401 when the OIDC token is refused, and sends no token on without Bearer', async () => {
    verify.mockRejectedValue(new OidcRefusal('The token is not from the release workflow.'));

    const refused = await upload();
    const noBearer = await upload({ token: null });

    expect(refused.status).toBe(401);
    expect(refused.body).toEqual({ error: 'The token is not from the release workflow.' });
    expect(noBearer.status).toBe(401);
    expect(verify).toHaveBeenLastCalledWith('', expect.any(Object));
    expect(await runAsPlatform(() => MaReleaseModel.countDocuments())).toBe(0);
  });

  it.each([
    ['a body that is not multipart', () => request(app).post(`${MA_REST_PATH}${RELEASE_UPLOAD_PATH}`).set('Authorization', 'Bearer t').send({ a: 1 }), 'Send a multipart/form-data body.'],
    ['a release.json that is not JSON', () => upload({ manifest: '{nope' }), 'release.json is not valid JSON.'],
    ['no internal ZIP in release.json', () => upload({ manifest: { ...manifestOf(zipOf()), files: [] } }), 'The file is not the internal ZIP release.json describes.'],
    ['a file named otherwise', () => upload({ fileName: 'other.zip' }), 'The file is not the internal ZIP release.json describes.'],
    ['a size release.json does not name', () => upload({ manifest: manifestOf(zipOf(1, 80)) }), 'The file is not the ZIP release.json describes.'],
    ['bytes that are not a ZIP', () => { const fake = Buffer.alloc(64, 7); return upload({ zip: fake, manifest: manifestOf(fake) }); }, 'The file is not the ZIP release.json describes.'],
    ['a checksum that does not match', () => upload({ manifest: manifestOf(zipOf(3)) }), 'The ZIP does not match its SHA-256 checksum.'],
    ['a version Chrome does not take', () => upload({ manifest: { ...manifestOf(zipOf()), version: '1.4.x' } }), 'The version must be a Chrome extension version, e.g. 1.2.3.'],
  ])('answers 400 for %s', async (_case, send, error) => {
    jest.spyOn(logger, 'warn').mockImplementation(() => undefined);

    const response = await send();

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error });
    expect(await runAsPlatform(() => MaReleaseModel.countDocuments())).toBe(0);
  });

  it('answers 400 when the ZIP part is missing', async () => {
    const response = await request(app)
      .post(`${MA_REST_PATH}${RELEASE_UPLOAD_PATH}`)
      .set('Authorization', 'Bearer t')
      .field('release', JSON.stringify(manifestOf(zipOf())));

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'Send the ZIP as "file" and release.json as "release".',
    });
  });

  it('answers 413 for a ZIP over 10 MB', async () => {
    const big = zipOf(1, MAX_RELEASE_ZIP_BYTES + 1);

    const response = await upload({ zip: big, manifest: manifestOf(big) });

    expect(response.status).toBe(413);
    expect(response.body).toEqual({ error: 'The ZIP is larger than 10 MB.' });
  });

  it('defaults to the INTERNAL channel and Chrome 116, and keeps notes to 2000 characters', async () => {
    const zip = zipOf();
    const manifest = { ...manifestOf(zip), releaseChannel: 'NIGHTLY', minChromeVersion: undefined };

    await upload({ zip, manifest, notes: 'n'.repeat(2500) });

    expect(await releaseService.releaseByVersion('1.4.0.45')).toMatchObject({
      channel: 'INTERNAL',
      minChromeVersion: '116',
      releaseNotes: 'n'.repeat(2000),
    });
  });

  it('still registers the build when no operator company exists to audit it in', async () => {
    const warn = jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
    await runAsPlatform(() =>
      OrganizationModel.updateOne({ _id: organizationId }, { $set: { isPlatformOperator: false } }),
    );
    invalidatePlatformOperatorCache();

    const response = await upload();

    expect(response.status).toBe(201);
    expect(warn).toHaveBeenCalledWith(
      { version: '1.4.0.45' },
      'No operator company to audit the extension upload in',
    );
    expect(await runAsPlatform(() => AuditLogModel.countDocuments())).toBe(0);
  });

  it('allows ten uploads an hour from one address', async () => {
    jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
    verify.mockRejectedValue(new OidcRefusal('refused'));
    const statuses = await Array.from({ length: 11 }).reduce<Promise<number[]>>(
      (previous) => previous.then(async (list) => [...list, (await upload()).status]),
      Promise.resolve([]),
    );

    expect(statuses.slice(0, 10)).toEqual(Array.from({ length: 10 }, () => 401));
    expect(statuses[10]).toBe(429);
  });
});
