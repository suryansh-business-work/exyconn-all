import { Types } from 'mongoose';
import { useTestOrganization } from '../../../helpers';
import {
  maAdminMutations,
  maAdminQueries,
} from '../../../../src/modules/meeting-assistant/ma.admin.resolvers';
import {
  channelsFor,
  openReleaseArtifact,
  type RegisterReleaseInput,
} from '../../../../src/modules/meeting-assistant/releases.service';
import {
  DOWNLOAD_LINK_TTL_MS,
  readDownloadToken,
  signedDownloadUrl,
} from '../../../../src/modules/meeting-assistant/download-links';
import { saveChunk } from '../../../../src/modules/meeting-assistant/recording.store';
import { monthStart } from '../../../../src/modules/meeting-assistant/settings.service';
import {
  MaExtensionSessionModel,
  MaGoogleConnectionModel,
  MaGoogleStateModel,
  MaJobModel,
  MaReleaseModel,
} from '../../../../src/modules/meeting-assistant/models';
import type { MaSettingsInput } from '../../../../src/modules/meeting-assistant/settings.service';
import { readGoogleConfig } from '../../../../src/modules/auth/google/google-sign-in.config';
import { githubActions } from '../../../../src/utils/github';
import { OrganizationModel } from '../../../../src/modules/organizations';
import { invalidatePlatformOperatorCache } from '../../../../src/lib/platformAccess';
import { runAsPlatform } from '../../../../src/lib/tenant';
import { ROLES } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import type { MaActor } from '../../../../src/modules/meeting-assistant/ma.access';
import { codeOf } from '../codeOf';
import { authorizeInput, pkce } from './ma.signin';
import { ctxOf, seedAccount, seedMeeting, wavOf } from './ma.fixtures';

jest.mock('../../../../src/config/env', () =>
  jest.requireActual('./ma.env').envTrustingExtension(),
);
jest.mock('../../../../src/utils/github', () => ({
  githubActions: { isRepoReleaseAsset: jest.fn(), openReleaseAsset: jest.fn() },
}));
jest.mock('../../../../src/modules/auth/google/google-sign-in.config', () => ({
  readGoogleConfig: jest.fn(),
}));

const isRepoAsset = githubActions.isRepoReleaseAsset as jest.Mock;
const openAsset = githubActions.openReleaseAsset as jest.Mock;
const googleConfig = readGoogleConfig as jest.Mock;

const organizationId = useTestOrganization();
const PORTAL = 'http://localhost:1001';
const SHA = 'a'.repeat(64);

let employee: MaActor;
let manager: MaActor;
let asEmployee: GraphQLContext;
/** An ADMIN of the platform operator organization: a release manager. */
let asManager: GraphQLContext;

const release = (overrides: Partial<RegisterReleaseInput> = {}): RegisterReleaseInput => ({
  version: '1.2.3',
  channel: 'STABLE',
  buildNumber: 7,
  commitSha: 'ABCDEF1',
  builtAt: new Date('2026-10-01T00:00:00Z'),
  artifactName: 'meet-extension-1.2.3.zip',
  artifactSize: 1024,
  sha256: SHA.toUpperCase(),
  assetUrl: 'https://api.github.com/repos/exyconn/all/releases/assets/1',
  releaseUrl: '',
  buildRunUrl: '',
  releaseNotes: 'Notes',
  minChromeVersion: '120',
  ...overrides,
});

const register = (input: RegisterReleaseInput) =>
  maAdminMutations.maRegisterRelease(null, { input }, asManager);

const moveTo = (id: string, status: string, extra: Record<string, unknown> = {}) =>
  maAdminMutations.maSetReleaseStatus(
    null,
    { id, input: { status: status as never, note: 'QA passed', ...extra } },
    asManager,
  );

/** Registers a release and walks it through the flow to an approved, downloadable status. */
async function approvedRelease(overrides: Partial<RegisterReleaseInput> = {}) {
  const created = await register(release(overrides));
  await moveTo(created.id, 'READY_FOR_INTERNAL_TESTING');
  return moveTo(created.id, 'INTERNAL_RELEASED');
}

const tokenOf = (url: string) => new URL(url).searchParams.get('token') ?? '';

beforeEach(async () => {
  isRepoAsset.mockResolvedValue(true);
  googleConfig.mockResolvedValue({ clientId: 'client-id', clientSecret: 'client-secret' });
  await runAsPlatform(() =>
    OrganizationModel.updateOne({ _id: organizationId }, { $set: { isPlatformOperator: true } }),
  );
  invalidatePlatformOperatorCache();
  employee = await seedAccount('Asha', [ROLES.EMPLOYEE]);
  manager = await seedAccount('Root', [ROLES.ADMIN]);
  // A company other than the operator: what every customer's employee calls from.
  asEmployee = {
    ...ctxOf(employee, [ROLES.EMPLOYEE]),
    organizationId: new Types.ObjectId().toHexString(),
  };
  asManager = { ...ctxOf(manager, [ROLES.ADMIN]), organizationId };
});

describe('settings', () => {
  const input = (overrides: Partial<MaSettingsInput> = {}) =>
    ({
      enabled: true,
      allowedUserIds: [manager.id, employee.id, manager.id],
      defaultRecipients: [' OPS@exyconn.com ', ''],
      emailAllowedDomains: ['Exyconn.com'],
      monthlyBudgetUsd: 50,
      ...overrides,
    }) as MaSettingsInput;

  it('shows the settings and this month’s spend to a company editor only', async () => {
    await seedMeeting(employee, { costUsd: 2.5, startedAt: new Date() });
    await seedMeeting(employee, {
      meetingCode: 'old-oldo-old',
      costUsd: 9,
      startedAt: new Date(monthStart(new Date()).getTime() - 1000),
    });

    const view = await maAdminQueries.maSettings(null, {}, asManager);

    expect(view).toMatchObject({ enabled: true, summaryStyle: 'DETAILED', monthSpendUsd: 2.5 });
    expect(
      await codeOf(maAdminQueries.maSettings(null, {}, ctxOf(employee, [ROLES.EMPLOYEE]))),
    ).toBe('FORBIDDEN');
  });

  it('saves cleaned lists and refuses recipients outside the allowed domains', async () => {
    const saved = await maAdminMutations.maUpdateSettings(null, { input: input() }, asManager);

    expect(saved).toMatchObject({
      allowedUserIds: [manager.id, employee.id],
      defaultRecipients: ['ops@exyconn.com'],
      emailAllowedDomains: ['exyconn.com'],
      updatedByName: 'Root',
    });
    const refused = [
      input({ emailAllowedDomains: ['not a domain'] }),
      input({ defaultRecipients: ['not-an-email'] }),
      input({ defaultRecipients: ['ops@gmail.com'] }),
    ];
    const codes = await Promise.all(
      refused.map((each) =>
        codeOf(maAdminMutations.maUpdateSettings(null, { input: each }, asManager)),
      ),
    );
    expect(codes).toEqual(['BAD_USER_INPUT', 'BAD_USER_INPUT', 'BAD_USER_INPUT']);
    expect(
      await codeOf(
        maAdminMutations.maUpdateSettings(
          null,
          { input: input() },
          ctxOf(employee, [ROLES.EMPLOYEE]),
        ),
      ),
    ).toBe('FORBIDDEN');
  });
});

describe('the extension and its sessions', () => {
  it('tells the extension who it is signed in as, and for which company', async () => {
    const context = await maAdminQueries.maExtensionContext(
      null,
      {},
      {
        ...ctxOf(employee, [ROLES.EMPLOYEE]),
        organizationId,
      },
    );

    expect(context).toMatchObject({
      userId: employee.id,
      name: 'Asha',
      organizationName: 'Test Co',
      googleConnected: false,
      enabled: true,
    });
    expect(
      (await maAdminQueries.maExtensionContext(null, {}, ctxOf(employee, [ROLES.EMPLOYEE])))
        .organizationName,
    ).toBe('');
  });

  it('connects the extension from the portal but never from an extension token', async () => {
    const { challenge } = pkce();
    const ctx = ctxOf(employee, [ROLES.EMPLOYEE]);

    const url = await maAdminMutations.maAuthorizeExtension(
      null,
      { input: authorizeInput(challenge) },
      ctx,
    );

    expect(new URL(url).searchParams.get('code')).toBeTruthy();
    expect(
      await codeOf(
        maAdminMutations.maAuthorizeExtension(
          null,
          { input: authorizeInput(challenge) },
          ctxOf(employee, [ROLES.EMPLOYEE], { esid: 's1' }),
        ),
      ),
    ).toBe('BAD_USER_INPUT');
  });

  it('lists the caller’s sessions, marks the current one, and signs one out once', async () => {
    const ctx = ctxOf(employee, [ROLES.EMPLOYEE]);
    const session = await MaExtensionSessionModel.create({
      userId: employee.id,
      extensionId: 'x',
      refreshHash: 'h',
      expiresAt: new Date(Date.now() + 60_000),
    });
    const id = String(session._id);

    const sessions = await maAdminQueries.maMyExtensionSessions(
      null,
      {},
      { ...ctx, user: { ...ctx.user!, esid: id } },
    );

    expect(sessions.map((row) => [row.id, row.current])).toEqual([[id, true]]);
    expect(await maAdminMutations.maRevokeExtensionSession(null, { id }, ctx)).toBe(true);
    expect(await maAdminMutations.maRevokeExtensionSession(null, { id }, ctx)).toBe(false);
  });
});

describe('Google Meet connection', () => {
  it('starts Google’s consent with PKCE for a portal page, remembering who asked', async () => {
    const ctx = { ...ctxOf(employee, [ROLES.EMPLOYEE]), organizationId };

    const url = new URL(
      await maAdminMutations.maStartGoogleConnect(null, { returnTo: `${PORTAL}/me/meetings` }, ctx),
    );

    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.get('scope')).toContain('meetings.space.readonly');
    const state = await runAsPlatform(() =>
      MaGoogleStateModel.findOne({ nonce: url.searchParams.get('state') }).lean(),
    );
    expect(state).toMatchObject({ userId: employee.id, organizationId });
  });

  it('refuses outside a company, a foreign return address and a missing Google client', async () => {
    const inCompany = { ...ctxOf(employee, [ROLES.EMPLOYEE]), organizationId };
    const start = (returnTo: string, ctx: GraphQLContext) =>
      codeOf(maAdminMutations.maStartGoogleConnect(null, { returnTo }, ctx));

    expect(await start(PORTAL, ctxOf(employee, [ROLES.EMPLOYEE]))).toBe('BAD_USER_INPUT');
    expect(await start('https://evil.example.com/x', inCompany)).toBe('BAD_USER_INPUT');
    expect(await start('not a url', inCompany)).toBe('BAD_USER_INPUT');
    googleConfig.mockResolvedValue({ clientId: '', clientSecret: '' });
    expect(await start(PORTAL, inCompany)).toBe('BAD_USER_INPUT');
  });

  it('reports the connection and disconnects it once', async () => {
    const ctx = ctxOf(employee, [ROLES.EMPLOYEE]);
    await MaGoogleConnectionModel.create({
      userId: employee.id,
      email: 'asha@gmail.com',
      refreshToken: 'sealed',
    });

    expect(await maAdminQueries.maGoogleConnection(null, {}, ctx)).toMatchObject({
      configured: true,
      connected: true,
      email: 'asha@gmail.com',
    });
    expect(await maAdminMutations.maDisconnectGoogle(null, {}, ctx)).toBe(true);
    expect(await maAdminMutations.maDisconnectGoogle(null, {}, ctx)).toBe(false);
    expect(await maAdminQueries.maGoogleConnection(null, {}, ctx)).toMatchObject({
      connected: false,
      email: null,
    });
  });

  it('queues an official import only for an ended call whose owner connected Google', async () => {
    const ctx = ctxOf(employee, [ROLES.EMPLOYEE]);
    const live = await seedMeeting(employee);
    const ended = await seedMeeting(employee, { meetingCode: 'xyz-wxyz-xyz', status: 'ENDED' });
    const importFor = (meetingId: string) =>
      maAdminMutations.maImportOfficialTranscript(null, { meetingId }, ctx);

    expect(await codeOf(importFor(String(ended._id)))).toBe('BAD_USER_INPUT');
    await MaGoogleConnectionModel.create({
      userId: employee.id,
      email: 'a@gmail.com',
      refreshToken: 's',
    });
    expect(await codeOf(importFor(String(live._id)))).toBe('BAD_USER_INPUT');

    const queued = await importFor(String(ended._id));

    expect(queued.officialImportStatus).toBe('QUEUED');
    expect(
      await MaJobModel.countDocuments({ kind: 'IMPORT_OFFICIAL', meetingId: String(ended._id) }),
    ).toBe(1);
  });
});

describe('recordings', () => {
  it('lists saved audio, returns one chunk, and refuses an unknown stream or chunk', async () => {
    const meeting = await seedMeeting(employee);
    const meetingId = String(meeting._id);
    const ctx = ctxOf(employee, [ROLES.EMPLOYEE]);
    const audio = wavOf(32_000);
    await saveChunk({ meetingId, stream: 'MIC', seq: 0 }, audio, 1000);
    const chunk = (stream: string, seq: number) =>
      maAdminQueries.maRecordingChunkBase64(null, { meetingId, stream, seq }, ctx);

    expect(await maAdminQueries.maRecording(null, { meetingId }, ctx)).toEqual([
      { stream: 'MIC', chunkCount: 1, seconds: 1, sizeBytes: audio.length },
    ]);
    expect(await chunk('MIC', 0)).toBe(audio.toString('base64'));
    expect(await codeOf(chunk('MIC', 1))).toBe('NOT_FOUND');
    expect(await codeOf(chunk('VIDEO', 0))).toBe('BAD_USER_INPUT');
  });

  it('issues a signed download link for the caller and their company', async () => {
    const meeting = await seedMeeting(employee);
    const meetingId = String(meeting._id);
    const ctx = { ...ctxOf(employee, [ROLES.EMPLOYEE]), organizationId };

    const link = await maAdminMutations.maRecordingDownloadLink(
      null,
      { meetingId, stream: 'TAB' },
      ctx,
    );

    expect(link.fileName).toBe(`meeting-${meetingId}-tab.wav`);
    expect(readDownloadToken(tokenOf(link.url))).toMatchObject({
      kind: 'recording',
      id: meetingId,
      stream: 'TAB',
      userId: employee.id,
      organizationId,
    });
  });
});

describe('signed download links', () => {
  const grant = { kind: 'release' as const, id: 'r1', userId: 'u1', organizationId: null };

  it('verifies until it expires', () => {
    const now = Date.now();
    const token = tokenOf(signedDownloadUrl(grant, now).url);

    expect(readDownloadToken(token, now)).toEqual({ ...grant, exp: now + DOWNLOAD_LINK_TTL_MS });
    expect(readDownloadToken(token, now + DOWNLOAD_LINK_TTL_MS)).toBeNull();
  });

  it('rejects a changed grant, a forged signature and a malformed token', () => {
    const token = tokenOf(signedDownloadUrl(grant).url);
    const [payload, signature] = token.split('.');
    const forgedPayload = Buffer.from(
      JSON.stringify({ ...grant, id: 'r2', exp: Date.now() + 60_000 }),
    ).toString('base64url');

    expect(readDownloadToken(`${forgedPayload}.${signature}`)).toBeNull();
    expect(readDownloadToken(`${payload}.${signature.slice(1)}`)).toBeNull();
    expect(readDownloadToken(payload)).toBeNull();
    expect(readDownloadToken('')).toBeNull();
  });
});

describe('extension releases', () => {
  it('registers a build once per checksum, normalising it', async () => {
    const first = await register(release());
    const again = await register(release());

    expect(again.id).toBe(first.id);
    expect(first).toMatchObject({
      sha256: SHA,
      commitSha: 'abcdef1',
      status: 'QA_PENDING',
      downloadable: false,
    });
    expect(await codeOf(register(release({ sha256: 'b'.repeat(64) })))).toBe('BAD_USER_INPUT');
    expect(await runAsPlatform(() => MaReleaseModel.countDocuments())).toBe(1);
  });

  it('refuses a bad version, checksum, commit, artifact or asset, and anyone but a manager', async () => {
    const refused = [
      release({ version: '1.2.3.4.5' }),
      release({ version: '1.70000' }),
      release({ sha256: 'xyz' }),
      release({ commitSha: 'not-a-sha' }),
      release({ artifactName: 'build.tar' }),
      release({ artifactSize: 0 }),
    ];
    const codes = await Promise.all(refused.map((input) => codeOf(register(input))));
    expect(codes).toEqual(refused.map(() => 'BAD_USER_INPUT'));

    isRepoAsset.mockResolvedValue(false);
    expect(await codeOf(register(release()))).toBe('BAD_USER_INPUT');
    expect(
      await codeOf(maAdminMutations.maRegisterRelease(null, { input: release() }, asEmployee)),
    ).toBe('FORBIDDEN');
  });

  it('moves only along the release flow and publishes only with a store listing', async () => {
    const created = await register(release());

    expect(await codeOf(moveTo(created.id, 'PUBLISHED'))).toBe('BAD_USER_INPUT');
    expect(await codeOf(moveTo(created.id, 'READY_FOR_INTERNAL_TESTING', { note: '  ' }))).toBe(
      'BAD_USER_INPUT',
    );
    expect(await codeOf(moveTo(new Types.ObjectId().toHexString(), 'DEPRECATED'))).toBe(
      'NOT_FOUND',
    );
    await moveTo(created.id, 'READY_FOR_INTERNAL_TESTING');
    await moveTo(created.id, 'INTERNAL_RELEASED');
    await moveTo(created.id, 'READY_FOR_STORE_SUBMISSION');
    await moveTo(created.id, 'SUBMITTED_FOR_REVIEW');
    expect(
      await codeOf(moveTo(created.id, 'PUBLISHED', { storeUrl: 'https://example.com/item' })),
    ).toBe('BAD_USER_INPUT');

    const published = await moveTo(created.id, 'PUBLISHED', {
      storeUrl: ' https://chromewebstore.google.com/detail/abc ',
      storeItemId: ' abc ',
    });

    expect(published).toMatchObject({
      status: 'PUBLISHED',
      storeUrl: 'https://chromewebstore.google.com/detail/abc',
      storeItemId: 'abc',
      downloadable: true,
    });
    expect(published.statusHistory.map((event) => event.status)).toEqual([
      'QA_PENDING',
      'READY_FOR_INTERNAL_TESTING',
      'INTERNAL_RELEASED',
      'READY_FOR_STORE_SUBMISSION',
      'SUBMITTED_FOR_REVIEW',
      'PUBLISHED',
    ]);
  });

  it('shows a company only approved builds on its channel, and managers everything', async () => {
    expect(channelsFor('STABLE')).toEqual(['STABLE']);
    expect(channelsFor('INTERNAL')).toEqual(['STABLE', 'BETA', 'INTERNAL']);
    await approvedRelease();
    await approvedRelease({ version: '1.3.0', channel: 'BETA' });
    await register(release({ version: '1.4.0' }));

    const forEmployee = await maAdminQueries.maReleases(null, {}, asEmployee);
    const forManager = await maAdminQueries.maReleases(null, {}, asManager);

    expect(forEmployee.map((row) => [row.version, row.channel])).toEqual([['1.2.3', 'STABLE']]);
    expect(forManager).toHaveLength(3);
    expect((await maAdminQueries.maLatestRelease(null, {}, asEmployee))?.version).toBe('1.2.3');
  });

  it('answers no latest release when none is approved', async () => {
    await register(release());

    expect(await maAdminQueries.maLatestRelease(null, {}, asEmployee)).toBeNull();
  });

  it('links an approved build for download and counts each download', async () => {
    const approved = await approvedRelease();
    const draft = await register(release({ version: '2.0.0' }));
    openAsset.mockResolvedValue({ body: 'zip-bytes' });

    const link = await maAdminMutations.maReleaseDownloadLink(
      null,
      { id: approved.id },
      asEmployee,
    );
    const opened = await openReleaseArtifact(approved.id);

    expect(link).toMatchObject({ fileName: 'meet-extension-1.2.3.zip', sha256: SHA });
    expect(readDownloadToken(tokenOf(link.url))).toMatchObject({
      kind: 'release',
      id: approved.id,
    });
    expect(opened.response).toEqual({ body: 'zip-bytes' });
    expect(openAsset).toHaveBeenCalledWith(release().assetUrl);
    expect(
      (await runAsPlatform(() => MaReleaseModel.findById(approved.id).lean()))?.downloadCount,
    ).toBe(1);
    expect(
      await codeOf(maAdminMutations.maReleaseDownloadLink(null, { id: draft.id }, asEmployee)),
    ).toBe('NOT_FOUND');
    expect(await codeOf(openReleaseArtifact(new Types.ObjectId().toHexString()))).toBe('NOT_FOUND');
  });
});
