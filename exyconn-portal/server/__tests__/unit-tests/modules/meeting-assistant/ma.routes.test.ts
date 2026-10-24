import express from 'express';
import request from 'supertest';
import { useTestOrganization } from '../../../helpers';
import {
  GOOGLE_MEET_CALLBACK_PATH,
  MA_REST_PATH,
  googleMeetConnectRouter,
  meetingAssistantResolvers,
  meetAssistantRouter,
} from '../../../../src/modules/meeting-assistant';
import { signedDownloadUrl } from '../../../../src/modules/meeting-assistant/download-links';
import * as extensionAuth from '../../../../src/modules/meeting-assistant/extension.auth';
import { saveChunk } from '../../../../src/modules/meeting-assistant/recording.store';
import { startGoogleMeetConnect } from '../../../../src/modules/meeting-assistant/google-meet.connect';
import {
  MaExtensionSessionModel,
  MaGoogleConnectionModel,
  MaReleaseModel,
} from '../../../../src/modules/meeting-assistant/models';
import { openAiClient } from '../../../../src/utils/openai';
import * as releaseStore from '../../../../src/modules/meeting-assistant/releases.store';
import { signToken, verifyToken } from '../../../../src/utils/jwt';
import { open } from '../../../../src/utils/secretBox';
import { readGoogleConfig } from '../../../../src/modules/auth/google/google-sign-in.config';
import {
  exchangeForTokens,
  verifiedEmailOf,
} from '../../../../src/modules/auth/google/google-sign-in.oauth';
import { UserModel } from '../../../../src/modules/admin/user.model';
import { runAsPlatform } from '../../../../src/lib/tenant';
import { ROLES } from '../../../../src/constants/roles';
import type { MaActor } from '../../../../src/modules/meeting-assistant/ma.access';
import { EXTENSION_ID } from './ma.env';
import { issueCode, REDIRECT, signIn } from './ma.signin';
import { seedAccount, seedMeeting, seedOpenAiConfig, setMaSettings, wavOf } from './ma.fixtures';

jest.mock('../../../../src/config/env', () =>
  jest.requireActual('./ma.env').envTrustingExtension(),
);
jest.mock('../../../../src/utils/openai', () => ({
  ...jest.requireActual('../../../../src/utils/openai'),
  openAiClient: { transcribe: jest.fn() },
}));
jest.mock('../../../../src/modules/auth/google/google-sign-in.config', () => ({
  readGoogleConfig: jest.fn(),
}));
jest.mock('../../../../src/modules/auth/google/google-sign-in.oauth', () => ({
  ...jest.requireActual('../../../../src/modules/auth/google/google-sign-in.oauth'),
  exchangeForTokens: jest.fn(),
  verifiedEmailOf: jest.fn(),
}));

const transcribe = openAiClient.transcribe as jest.Mock;
const exchange = exchangeForTokens as jest.Mock;

const organizationId = useTestOrganization();
const PORTAL = 'http://localhost:1001';

const app = express();
app.use(MA_REST_PATH, meetAssistantRouter());
app.use(GOOGLE_MEET_CALLBACK_PATH, googleMeetConnectRouter());

let actor: MaActor;

const token = (body: Record<string, unknown>) =>
  request(app).post(`${MA_REST_PATH}/auth/token`).send(body);

/** Uploads one chunk as the extension does: base64 WAV in JSON, with its Bearer token. */
const upload = (bearer: string | null, body: Record<string, unknown>) => {
  const call = request(app).post(`${MA_REST_PATH}/audio`).send(body);
  return bearer ? call.set('Authorization', `Bearer ${bearer}`) : call;
};

const chunkFor = (meetingId: string, overrides: Record<string, unknown> = {}) => ({
  meetingId,
  stream: 'MIC',
  seq: 0,
  startMs: 0,
  durationMs: 1000,
  audio: wavOf(32_000).toString('base64'),
  ...overrides,
});

const download = (url: string) => request(app).get(new URL(url).pathname + new URL(url).search);

beforeEach(async () => {
  actor = await seedAccount('Asha', [ROLES.EMPLOYEE]);
  (readGoogleConfig as jest.Mock).mockResolvedValue({ clientId: 'id', clientSecret: 'secret' });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('the module entry point', () => {
  it('exposes every resolver of the module', () => {
    expect(Object.keys(meetingAssistantResolvers.Query)).toEqual(
      expect.arrayContaining([
        'maMeeting',
        'maNotes',
        'maSettings',
        'maAvailableModels',
        'maReleaseOverview',
        'maReleaseSettings',
      ]),
    );
    expect(Object.keys(meetingAssistantResolvers.Mutation)).toEqual(
      expect.arrayContaining([
        'maStartSession',
        'maUpdateNotes',
        'maApproveRelease',
        'maStartExtensionBuild',
        'maUpdateReleaseSettings',
      ]),
    );
    expect(meetingAssistantResolvers.Mutation).not.toHaveProperty('maRegisterRelease');
  });
});

describe('POST /auth/token', () => {
  it('trades a code for tokens, then renews them', async () => {
    const { code, verifier } = await issueCode(actor);

    const granted = await token({
      grant_type: 'authorization_code',
      code,
      code_verifier: verifier,
      redirect_uri: REDIRECT,
      extension_id: EXTENSION_ID,
      device_label: 'Laptop',
    });
    const renewed = await token({
      grant_type: 'refresh_token',
      refresh_token: granted.body.refresh_token,
    });

    expect(granted.status).toBe(200);
    expect(granted.headers['cache-control']).toBe('no-store');
    expect(verifyToken(granted.body.access_token)?.esid).toBeTruthy();
    expect(renewed.status).toBe(200);
    expect(renewed.body.refresh_token).not.toBe(granted.body.refresh_token);
  });

  it('answers OAuth errors: 401 for a bad grant, 400 for a bad request or grant type', async () => {
    const badGrant = await token({ grant_type: 'refresh_token', refresh_token: 'nope' });
    const badRequest = await token({
      grant_type: 'authorization_code',
      code: 'x',
      code_verifier: 'short',
    });
    const badType = await token({ grant_type: 'client_credentials' });
    const noBody = await request(app).post(`${MA_REST_PATH}/auth/token`);

    expect([badGrant.status, badGrant.body.error]).toEqual([401, 'invalid_grant']);
    expect([badRequest.status, badRequest.body.error]).toEqual([400, 'invalid_request']);
    expect([badType.status, badType.body.error]).toEqual([400, 'unsupported_grant_type']);
    expect(noBody.status).toBe(400);
  });

  it('signs in with a password, or asks for the second factor and then takes it', async () => {
    const tokens = { access_token: 'a', token_type: 'Bearer', refresh_token: 'r' };
    const password = jest
      .spyOn(extensionAuth, 'signInWithPassword')
      .mockResolvedValueOnce({ mfa_required: true, mfa_challenge: 'c1' });
    const second = jest
      .spyOn(extensionAuth, 'completeMfaSignIn')
      .mockResolvedValueOnce(tokens as never);

    const first = await token({
      grant_type: 'password',
      email: 'ravi@exyconn.com',
      password: `pw-${Date.now()}`,
      extension_id: EXTENSION_ID,
      device_label: 'Laptop',
    });
    const done = await token({
      grant_type: 'mfa',
      mfa_challenge: 'c1',
      code: '123456',
      extension_id: EXTENSION_ID,
    });

    expect(first.body).toEqual({ mfa_required: true, mfa_challenge: 'c1' });
    expect(password).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'ravi@exyconn.com', extensionId: EXTENSION_ID }),
      expect.objectContaining({ deviceLabel: 'Laptop' }),
    );
    expect(second).toHaveBeenCalledWith(
      expect.objectContaining({ challenge: 'c1', code: '123456', extensionId: EXTENSION_ID }),
      expect.objectContaining({ deviceLabel: '' }),
    );
    expect(done.body).toEqual(tokens);
  });

  it('answers 500 without detail when sign-in fails unexpectedly', async () => {
    jest.spyOn(extensionAuth, 'refreshSession').mockRejectedValueOnce(new Error('database down'));

    const response = await token({ grant_type: 'refresh_token', refresh_token: 'x' });

    expect([response.status, response.body.error]).toEqual([500, 'server_error']);
  });

  it('slows down a burst of sign-in attempts', async () => {
    const responses = await Promise.all(
      Array.from({ length: 32 }, () => token({ grant_type: 'client_credentials' })),
    );

    expect(responses.some((response) => response.status === 429)).toBe(true);
  });
});

describe('POST /auth/revoke', () => {
  it('answers 204 even when the sign-out could not be written', async () => {
    jest.spyOn(extensionAuth, 'revokeByRefreshToken').mockRejectedValueOnce(new Error('down'));

    expect((await request(app).post(`${MA_REST_PATH}/auth/revoke`).send({})).status).toBe(204);
  });

  it('signs the extension out, and answers the same for an unknown token', async () => {
    const tokens = await signIn(actor);

    const revoked = await request(app)
      .post(`${MA_REST_PATH}/auth/revoke`)
      .send({ refresh_token: tokens.refresh_token });
    const unknown = await request(app).post(`${MA_REST_PATH}/auth/revoke`).send({});

    expect([revoked.status, unknown.status]).toEqual([204, 204]);
    expect((await MaExtensionSessionModel.findOne().lean())?.revokedReason).toBe('Signed out');
  });
});

describe('POST /audio', () => {
  let bearer: string;
  let meetingId: string;

  beforeEach(async () => {
    await seedOpenAiConfig();
    bearer = (await signIn(actor)).access_token;
    meetingId = String((await seedMeeting(actor, { consentRecordedAt: new Date() }))._id);
    transcribe.mockResolvedValue({
      text: 'hello',
      language: 'en',
      segments: [],
      promptTokens: 0,
      completionTokens: 0,
    });
  });

  it('transcribes a chunk from a signed-in extension', async () => {
    const response = await upload(bearer, chunkFor(meetingId));

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: 'DONE',
      segments: [expect.objectContaining({ text: 'hello', speakerLabel: 'Asha (microphone)' })],
    });
  });

  it('answers 401 without a live extension session', async () => {
    const portalToken = signToken({
      id: actor.id,
      roles: [ROLES.EMPLOYEE],
      email: actor.email,
      organizationId,
    });

    expect((await upload(null, chunkFor(meetingId))).status).toBe(401);
    expect((await upload(portalToken, chunkFor(meetingId))).status).toBe(401);
    await MaExtensionSessionModel.updateMany({}, { $set: { revokedAt: new Date() } });
    expect((await upload(bearer, chunkFor(meetingId))).status).toBe(401);
  });

  it('answers 401 once the account is switched off', async () => {
    await UserModel.updateOne({ _id: actor.id }, { $set: { isActive: false } });

    expect((await upload(bearer, chunkFor(meetingId))).status).toBe(401);
  });

  it('answers 400 for a malformed upload and 413 for one past the size cap', async () => {
    const malformed = [
      chunkFor('not-an-id'),
      chunkFor(meetingId, { stream: 'CAM' }),
      chunkFor(meetingId, { seq: -1 }),
      chunkFor(meetingId, { audio: '' }),
    ];
    const statuses = await Promise.all(malformed.map((body) => upload(bearer, body)));
    const huge = await upload(
      bearer,
      chunkFor(meetingId, { audio: Buffer.alloc(8 * 1024 * 1024 + 2).toString('base64') }),
    );

    expect(statuses.map((response) => response.status)).toEqual([400, 400, 400, 400]);
    expect([huge.status, huge.body.error]).toEqual([413, 'too_large']);
  });

  it('passes on the transcription refusals with their own status', async () => {
    const notWav = await upload(
      bearer,
      chunkFor(meetingId, { audio: Buffer.from('text').toString('base64') }),
    );
    const unconsented = String((await seedMeeting(actor, { meetingCode: 'xyz-wxyz-xyz' }))._id);
    const noConsent = await upload(bearer, chunkFor(unconsented));

    expect([notWav.status, notWav.body.error]).toEqual([415, 'unsupported_audio']);
    expect([noConsent.status, noConsent.body.error]).toEqual([409, 'consent_required']);
  });

  it('limits a burst of uploads and answers 500 when the session check itself fails', async () => {
    const theirs = String((await seedMeeting(await seedAccount('Ravi', [ROLES.EMPLOYEE])))._id);
    const burst = await Promise.all(
      Array.from({ length: 42 }, () => upload(bearer, chunkFor(theirs))),
    );
    jest.spyOn(extensionAuth, 'extensionSessionIsLive').mockRejectedValueOnce(new Error('down'));
    const failed = await upload(bearer, chunkFor(meetingId));

    expect(burst.some((response) => response.body.error === 'rate_limited')).toBe(true);
    expect([failed.status, failed.body.error]).toEqual([500, 'server_error']);
  });

  it('answers 404 for someone else’s meeting and 403 once the assistant is off', async () => {
    const theirs = String((await seedMeeting(await seedAccount('Ravi', [ROLES.EMPLOYEE])))._id);

    const notMine = await upload(bearer, chunkFor(theirs));
    await setMaSettings({ enabled: false });
    const disabled = await upload(bearer, chunkFor(meetingId));

    expect([notMine.status, notMine.body.error]).toEqual([404, 'not_found']);
    expect([disabled.status, disabled.body.error]).toEqual([403, 'disabled']);
  });
});

describe('GET /download', () => {
  const recordingLink = (meetingId: string, stream = 'MIC') =>
    signedDownloadUrl({
      kind: 'recording',
      id: meetingId,
      stream,
      userId: actor.id,
      organizationId,
    }).url;

  it('refuses an expired or forged link', async () => {
    const expired = signedDownloadUrl(
      { kind: 'recording', id: 'x', userId: actor.id, organizationId },
      Date.now() - 10 * 60_000,
    ).url;

    expect((await download(expired)).status).toBe(403);
    expect((await request(app).get(`${MA_REST_PATH}/download?token=forged.token`)).status).toBe(
      403,
    );
  });

  it('streams a meeting’s merged recording as a WAV attachment', async () => {
    const meetingId = String((await seedMeeting(actor))._id);
    await saveChunk({ meetingId, stream: 'MIC', seq: 0 }, wavOf(64, 7), 2);

    const response = await download(recordingLink(meetingId)).buffer(true);

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('audio/wav');
    expect(response.headers['content-disposition']).toContain(`meeting-${meetingId}-mic.wav`);
    expect((response.body as Buffer).subarray(44)).toEqual(Buffer.alloc(64, 7));
  });

  it('answers 404 for an unknown meeting, a bad stream or nothing saved', async () => {
    const meetingId = String((await seedMeeting(actor))._id);

    expect((await download(recordingLink('6ad7b0d2f428c577485bfbf3'))).status).toBe(404);
    expect((await download(recordingLink(meetingId, 'CAM'))).status).toBe(404);
    expect((await download(recordingLink(meetingId, 'TAB'))).status).toBe(404);
  });

  it('streams a stored release ZIP with its checksum, and answers 502 when it is missing', async () => {
    const fileId = await releaseStore.saveReleaseZip('ext.zip', Buffer.from('zip'), {
      version: '1.0.0',
      sha256: 'c'.repeat(64),
    });
    const release = await runAsPlatform(() =>
      MaReleaseModel.create({
        version: '1.0.0',
        channel: 'STABLE',
        buildNumber: 1,
        commitSha: 'abcdef1',
        builtAt: new Date(),
        artifactName: 'ext"1.0.0.zip',
        artifactSize: 3,
        sha256: 'c'.repeat(64),
        fileId,
      }),
    );
    const link = signedDownloadUrl({
      kind: 'release',
      id: String(release._id),
      userId: actor.id,
      organizationId,
    }).url;

    const ok = await download(link).responseType('blob');
    await releaseStore.deleteReleaseZip(fileId);
    const failed = await download(link);

    expect(ok.status).toBe(200);
    expect(ok.headers['content-disposition']).toBe('attachment; filename="ext1.0.0.zip"');
    expect(ok.headers['x-checksum-sha256']).toBe('c'.repeat(64));
    expect((ok.body as Buffer).toString()).toBe('zip');
    expect(failed.status).toBe(502);
  });
});

describe('Google Meet connect callback', () => {
  const callback = (query: Record<string, string>) =>
    request(app).get(`${GOOGLE_MEET_CALLBACK_PATH}/callback`).query(query);

  const startConnect = async () => {
    const url = new URL(
      await startGoogleMeetConnect(`${PORTAL}/me/meetings`, actor, organizationId),
    );
    return url.searchParams.get('state') ?? '';
  };

  it('stores the sealed refresh token and returns to the portal', async () => {
    const state = await startConnect();
    exchange.mockResolvedValue({ refresh_token: 'refresh-1', id_token: 'id-token' });
    (verifiedEmailOf as jest.Mock).mockReturnValue('asha@gmail.com');

    const response = await callback({ state, code: 'auth-code' });

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe(
      `${PORTAL}/me/meetings?googleMeetConnected=asha%40gmail.com`,
    );
    const connection = await MaGoogleConnectionModel.findOne({ userId: actor.id }).lean();
    expect(connection?.email).toBe('asha@gmail.com');
    expect(open(connection?.refreshToken ?? '')).toBe('refresh-1');
    expect(connection?.scopes).toEqual([]);
    expect((await callback({ state, code: 'again' })).status).toBe(400);
  });

  it('stores the scopes Google granted, and replaces them on a reconnect', async () => {
    const meet = 'https://www.googleapis.com/auth/meetings.space.readonly';
    const calendar = 'https://www.googleapis.com/auth/calendar.events.readonly';
    (verifiedEmailOf as jest.Mock).mockReturnValue('asha@gmail.com');
    exchange.mockResolvedValueOnce({
      refresh_token: 'refresh-1',
      id_token: 'id-token',
      scope: `openid  ${meet} ${calendar}`,
    });
    await callback({ state: await startConnect(), code: 'first' });
    const first = await MaGoogleConnectionModel.findOne({ userId: actor.id }).lean();
    exchange.mockResolvedValueOnce({
      refresh_token: 'refresh-2',
      id_token: 'id-token',
      scope: meet,
    });
    await callback({ state: await startConnect(), code: 'second' });
    const second = await MaGoogleConnectionModel.findOne({ userId: actor.id }).lean();

    expect(first?.scopes).toEqual(['openid', meet, calendar]);
    expect(second?.scopes).toEqual([meet]);
    expect(open(second?.refreshToken ?? '')).toBe('refresh-2');
    expect(await MaGoogleConnectionModel.countDocuments()).toBe(1);
  });

  it('returns with the reason when consent was cancelled or offline access was not granted', async () => {
    const cancelled = await callback({ state: await startConnect() });
    exchange.mockResolvedValue({ id_token: 'id-token' });
    const noOffline = await callback({ state: await startConnect(), code: 'c' });

    expect(cancelled.headers.location).toContain(
      'googleMeetError=The+Google+Meet+connection+was+cancelled.',
    );
    expect(noOffline.headers.location).toContain(
      'googleMeetError=Google+did+not+grant+offline+access',
    );
    expect(await MaGoogleConnectionModel.countDocuments()).toBe(0);
  });

  it('refuses a callback with no or an unknown state', async () => {
    expect((await callback({})).status).toBe(400);
    expect((await callback({ state: 'unknown', code: 'c' })).status).toBe(400);
  });
});
