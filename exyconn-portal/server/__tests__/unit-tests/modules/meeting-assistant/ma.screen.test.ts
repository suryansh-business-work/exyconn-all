import { Readable, Writable } from 'node:stream';
import express from 'express';
import request from 'supertest';
import mongoose, { Types } from 'mongoose';
import { useTestOrganization } from '../../../helpers';
import { MA_REST_PATH, meetAssistantRouter } from '../../../../src/modules/meeting-assistant';
import { signedDownloadUrl } from '../../../../src/modules/meeting-assistant/download-links';
import * as screenStore from '../../../../src/modules/meeting-assistant/screen.store';
import {
  MAX_SCREEN_PIECE_BYTES,
  ScreenPieceTooLarge,
  deleteScreenPieces,
  saveScreenPiece,
  screenPartOf,
  screenStreamName,
  screenTracks,
} from '../../../../src/modules/meeting-assistant/screen.store';
import { saveChunk } from '../../../../src/modules/meeting-assistant/recording.store';
import {
  maAdminMutations,
  maAdminQueries,
} from '../../../../src/modules/meeting-assistant/ma.admin.resolvers';
import { deleteMeetingData } from '../../../../src/modules/meeting-assistant/meeting.delete';
import { finalizeSession } from '../../../../src/modules/meeting-assistant/meeting.lifecycle';
import { runRetentionPass } from '../../../../src/modules/meeting-assistant/ma.worker';
import { MaMeetingModel } from '../../../../src/modules/meeting-assistant/models';
import { AuditLogModel } from '../../../../src/modules/audit';
import { runForOrganization } from '../../../../src/lib/tenant';
import { ROLES } from '../../../../src/constants/roles';
import type { MaActor } from '../../../../src/modules/meeting-assistant/ma.access';
import { codeOf } from '../codeOf';
import { signIn } from './ma.signin';
import { ctxOf, seedAccount, seedMeeting, setMaSettings, wavOf } from './ma.fixtures';

jest.mock('../../../../src/config/env', () =>
  jest.requireActual('./ma.env').envTrustingExtension(),
);

const organizationId = useTestOrganization();
const DAY = 86_400_000;

const app = express();
app.use(MA_REST_PATH, meetAssistantRouter());

let actor: MaActor;

/** A piece as MediaRecorder writes one: the EBML magic, then `fill` bytes. */
const pieceOf = (fill: number, bytes = 32) =>
  Buffer.concat([Buffer.from([0x1a, 0x45, 0xdf, 0xa3]), Buffer.alloc(bytes, fill)]);

const save = (meetingId: string, seq: number, body: Buffer, part = 0, durationMs = 5000) =>
  saveScreenPiece({ meetingId, part, seq }, durationMs, Readable.from([body]));

const files = () => MaMeetingModel.db.collection('ma_screen.files');
const chunks = () => MaMeetingModel.db.collection('ma_screen.chunks');

/** Uploads one piece as the extension does: the raw WebM body, with its Bearer token. */
const uploadPiece = (
  bearer: string | null,
  path: string,
  body: Buffer = pieceOf(1),
  type = 'video/webm',
) => {
  const call = request(app).post(`${MA_REST_PATH}/video/${path}`).set('Content-Type', type);
  return (bearer ? call.set('Authorization', `Bearer ${bearer}`) : call).send(body);
};

const download = (meetingId: string, stream: string) => {
  const { url } = signedDownloadUrl({
    kind: 'recording',
    id: meetingId,
    stream,
    userId: actor.id,
    organizationId,
  });
  return request(app)
    .get(new URL(url).pathname + new URL(url).search)
    .buffer(true)
    .parse((res, done) => {
      const parts: Buffer[] = [];
      res.on('data', (part: Buffer) => parts.push(part));
      res.on('end', () => done(null, Buffer.concat(parts)));
    });
};

beforeAll(() => {
  // Named through Mongoose, the GridFS collections are emptied between tests like the rest.
  files();
  chunks();
});

beforeEach(async () => {
  actor = await seedAccount('Asha', [ROLES.EMPLOYEE]);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('screen track names', () => {
  it('names the first part SCREEN and each restart SCREEN_2, SCREEN_3…', () => {
    expect([0, 1, 2].map(screenStreamName)).toEqual(['SCREEN', 'SCREEN_2', 'SCREEN_3']);
    expect(['SCREEN', 'SCREEN_2', 'SCREEN_10'].map(screenPartOf)).toEqual([0, 1, 9]);
    expect(['SCREEN_1', 'SCREEN_0', 'SCREEN_', 'TAB', 'screen'].map(screenPartOf)).toEqual([
      null,
      null,
      null,
      null,
      null,
    ]);
  });
});

describe('the screen store', () => {
  it('lists one track per part, with honest seconds and sizes', async () => {
    const meetingId = String((await seedMeeting(actor))._id);
    await save(meetingId, 1, pieceOf(2), 0, 5000);
    await save(meetingId, 0, pieceOf(1), 0, 4600);
    await save(meetingId, 0, pieceOf(3, 10), 1, 2000);

    expect(await screenTracks(meetingId)).toEqual([
      { stream: 'SCREEN', chunkCount: 2, seconds: 10, sizeBytes: 72 },
      { stream: 'SCREEN_2', chunkCount: 1, seconds: 2, sizeBytes: 14 },
    ]);
  });

  it('replaces a piece saved again, so a retry leaves one copy', async () => {
    const meetingId = String((await seedMeeting(actor))._id);
    await save(meetingId, 0, pieceOf(1));
    await Promise.all([save(meetingId, 0, pieceOf(2)), save(meetingId, 0, pieceOf(2))]);

    expect(await files().countDocuments({ 'metadata.meetingId': meetingId })).toBe(1);
    expect((await screenTracks(meetingId))[0].chunkCount).toBe(1);
  });

  it('aborts a piece past the cap and keeps nothing of it', async () => {
    const meetingId = String((await seedMeeting(actor))._id);
    const big = Readable.from([Buffer.alloc(MAX_SCREEN_PIECE_BYTES), Buffer.alloc(1)]);

    await expect(saveScreenPiece({ meetingId, part: 0, seq: 0 }, 5000, big)).rejects.toThrow(
      ScreenPieceTooLarge,
    );
    expect(await files().countDocuments()).toBe(0);
    expect(await chunks().countDocuments()).toBe(0);
  });

  it('gives up on a body that breaks off mid-upload', async () => {
    const meetingId = String((await seedMeeting(actor))._id);
    const broken = new Readable({ read() {} });
    const saving = saveScreenPiece({ meetingId, part: 0, seq: 0 }, 5000, broken);
    broken.push(pieceOf(1));
    broken.destroy(new Error('socket hang up'));

    await expect(saving).rejects.toThrow('socket hang up');
    expect(await files().countDocuments()).toBe(0);
  });

  it('aborts the upload when storage fails mid-piece, even if the abort fails too', async () => {
    const abort = jest.fn().mockRejectedValue(new Error('already gone'));
    const failing = Object.assign(
      new Writable({
        write(_piece, _encoding, done) {
          done(new Error('disk full'));
        },
      }),
      { abort, id: new Types.ObjectId() },
    );
    jest
      .spyOn(mongoose.mongo.GridFSBucket.prototype, 'openUploadStream')
      .mockReturnValue(failing as never);

    await expect(save(new Types.ObjectId().toHexString(), 0, pieceOf(1))).rejects.toThrow(
      'disk full',
    );
    expect(abort).toHaveBeenCalledTimes(1);
  });

  it('keeps each company’s pieces to itself', async () => {
    const meetingId = String((await seedMeeting(actor))._id);
    await save(meetingId, 0, pieceOf(1));
    const other = new Types.ObjectId().toHexString();

    expect(await runForOrganization(other, () => screenTracks(meetingId))).toEqual([]);
    expect(await runForOrganization(other, () => deleteScreenPieces({ meetingId }))).toBe(0);
    expect(await files().findOne()).toMatchObject({ metadata: { organizationId, part: 0 } });
  });
});

describe('POST /video/:meetingId/:seq', () => {
  let bearer: string;
  let meetingId: string;

  beforeEach(async () => {
    bearer = (await signIn(actor)).access_token;
    meetingId = String((await seedMeeting(actor, { consentRecordedAt: new Date() }))._id);
  });

  it('streams a piece into storage and answers ok', async () => {
    const response = await uploadPiece(bearer, `${meetingId}/0?durationMs=5000`);
    const second = await uploadPiece(bearer, `${meetingId}/0?part=1&durationMs=1200`);

    expect([response.status, response.body]).toEqual([200, { ok: true }]);
    expect(second.status).toBe(200);
    expect(await screenTracks(meetingId)).toEqual([
      { stream: 'SCREEN', chunkCount: 1, seconds: 5, sizeBytes: 36 },
      { stream: 'SCREEN_2', chunkCount: 1, seconds: 1, sizeBytes: 36 },
    ]);
  });

  it('answers 401 without a live extension session', async () => {
    expect((await uploadPiece(null, `${meetingId}/0?durationMs=5000`)).status).toBe(401);
  });

  it('answers 400 for a malformed path or query, and 415 for another media type', async () => {
    const paths = [
      `not-an-id/0?durationMs=5000`,
      `${meetingId}/x?durationMs=5000`,
      `${meetingId}/0`,
      `${meetingId}/0?durationMs=0`,
      `${meetingId}/0?durationMs=60001`,
      `${meetingId}/0?durationMs=5000&part=-1`,
    ];
    const statuses = await Promise.all(paths.map((path) => uploadPiece(bearer, path)));
    const json = await uploadPiece(
      bearer,
      `${meetingId}/0?durationMs=5000`,
      pieceOf(1),
      'text/plain',
    );

    expect(statuses.map((response) => response.status)).toEqual([400, 400, 400, 400, 400, 400]);
    expect([json.status, json.body.error]).toEqual([415, 'unsupported_media']);
  });

  it('answers 413 for a piece past 8 MB, declared or streamed, and keeps nothing', async () => {
    const declared = await uploadPiece(
      bearer,
      `${meetingId}/0?durationMs=5000`,
      Buffer.alloc(MAX_SCREEN_PIECE_BYTES + 1),
    );
    const call = request(app)
      .post(`${MA_REST_PATH}/video/${meetingId}/1?durationMs=5000`)
      .set('Content-Type', 'video/webm')
      .set('Authorization', `Bearer ${bearer}`);
    call.write(Buffer.alloc(MAX_SCREEN_PIECE_BYTES / 2));
    call.write(Buffer.alloc(MAX_SCREEN_PIECE_BYTES / 2));
    call.write(Buffer.alloc(16));
    const streamed = await call;

    expect([declared.status, declared.body.error]).toEqual([413, 'too_large']);
    expect([streamed.status, streamed.body.error]).toEqual([413, 'too_large']);
    expect(await files().countDocuments()).toBe(0);
    expect(await chunks().countDocuments()).toBe(0);
  });

  it('refuses without consent, with recordings off and long after the call', async () => {
    const unconsented = String((await seedMeeting(actor, { meetingCode: 'xyz-wxyz-xyz' }))._id);
    const longEnded = String(
      (
        await seedMeeting(actor, {
          meetingCode: 'klm-nopq-rst',
          consentRecordedAt: new Date(),
          status: 'ENDED',
          endedAt: new Date(Date.now() - 20 * 60_000),
        })
      )._id,
    );
    const noConsent = await uploadPiece(bearer, `${unconsented}/0?durationMs=5000`);
    const late = await uploadPiece(bearer, `${longEnded}/0?durationMs=5000`);
    await setMaSettings({ saveRecordings: false });
    const off = await uploadPiece(bearer, `${meetingId}/0?durationMs=5000`);

    expect([noConsent.status, noConsent.body.error]).toEqual([409, 'consent_required']);
    expect([late.status, late.body.error]).toEqual([409, 'meeting_ended']);
    expect([off.status, off.body.error]).toEqual([409, 'recording_off']);
    expect(await files().countDocuments()).toBe(0);
  });

  it('still takes the final pieces of a call that just ended', async () => {
    const justEnded = String(
      (
        await seedMeeting(actor, {
          meetingCode: 'klm-nopq-rst',
          consentRecordedAt: new Date(),
          status: 'ENDED',
          endedAt: new Date(Date.now() - 5 * 60_000),
        })
      )._id,
    );

    expect((await uploadPiece(bearer, `${justEnded}/9?durationMs=3000`)).status).toBe(200);
  });

  it('answers 404 for someone else’s meeting, 403 once the assistant is off', async () => {
    const theirs = String((await seedMeeting(await seedAccount('Ravi', [ROLES.EMPLOYEE])))._id);

    const notMine = await uploadPiece(bearer, `${theirs}/0?durationMs=5000`);
    await setMaSettings({ enabled: false });
    const disabled = await uploadPiece(bearer, `${meetingId}/0?durationMs=5000`);

    expect([notMine.status, notMine.body.error]).toEqual([404, 'not_found']);
    expect([disabled.status, disabled.body.error]).toEqual([403, 'disabled']);
  });

  it('answers 500 when storage fails, and limits a burst of uploads', async () => {
    jest.spyOn(screenStore, 'saveScreenPiece').mockRejectedValueOnce(new Error('disk full'));
    const failed = await uploadPiece(bearer, `${meetingId}/0?durationMs=5000`);
    const theirs = String((await seedMeeting(await seedAccount('Ravi', [ROLES.EMPLOYEE])))._id);
    const burst = await Promise.all(
      Array.from({ length: 62 }, () => uploadPiece(bearer, `${theirs}/0?durationMs=5000`)),
    );

    expect([failed.status, failed.body.error]).toEqual([500, 'server_error']);
    expect(burst.some((response) => response.body.error === 'rate_limited')).toBe(true);
  });
});

describe('reading the screen recording in the portal', () => {
  it('lists screen tracks after the audio ones and downloads one part as one WebM', async () => {
    const meetingId = String((await seedMeeting(actor))._id);
    const ctx = { ...ctxOf(actor, [ROLES.EMPLOYEE]), organizationId };
    const audio = wavOf(32_000);
    await saveChunk({ meetingId, stream: 'MIC', seq: 0 }, audio, 1000);
    await save(meetingId, 1, pieceOf(2));
    await save(meetingId, 0, pieceOf(1));
    await save(meetingId, 0, pieceOf(7), 1);

    expect(await maAdminQueries.maRecording(null, { meetingId }, ctx)).toEqual([
      { stream: 'MIC', chunkCount: 1, seconds: 1, sizeBytes: audio.length },
      { stream: 'SCREEN', chunkCount: 2, seconds: 10, sizeBytes: 72 },
      { stream: 'SCREEN_2', chunkCount: 1, seconds: 5, sizeBytes: 36 },
    ]);
    const first = await download(meetingId, 'SCREEN');
    const second = await download(meetingId, 'SCREEN_2');

    expect(first.status).toBe(200);
    expect(first.headers['content-type']).toBe('video/webm');
    expect(first.headers['content-disposition']).toContain(`meeting-${meetingId}-screen.webm`);
    expect(first.body).toEqual(Buffer.concat([pieceOf(1), pieceOf(2)]));
    expect(second.headers['content-disposition']).toContain(`meeting-${meetingId}-screen_2.webm`);
    expect(second.body).toEqual(pieceOf(7));
    expect((await download(meetingId, 'SCREEN_3')).status).toBe(404);
    expect((await download(meetingId, 'SCREEN_1')).status).toBe(404);
  });

  it('issues a WebM link for a screen track and audits it, but no chunk of it', async () => {
    const meeting = await seedMeeting(actor);
    const meetingId = String(meeting._id);
    const ctx = { ...ctxOf(actor, [ROLES.EMPLOYEE]), organizationId };

    const first = await maAdminMutations.maRecordingDownloadLink(
      null,
      { meetingId, stream: 'SCREEN' },
      ctx,
    );
    const later = await maAdminMutations.maRecordingDownloadLink(
      null,
      { meetingId, stream: 'SCREEN_2' },
      ctx,
    );

    expect([first.fileName, later.fileName]).toEqual([
      `meeting-${meetingId}-screen.webm`,
      `meeting-${meetingId}-screen_2.webm`,
    ]);
    const summaries = await AuditLogModel.find({ entityLabel: meeting.title }).distinct('summary');
    expect(summaries).toEqual(
      expect.arrayContaining([
        'Downloaded the screen recording',
        'Downloaded the screen recording (part 2)',
      ]),
    );
    expect(
      await codeOf(
        maAdminMutations.maRecordingDownloadLink(null, { meetingId, stream: 'SCREEN_1' }, ctx),
      ),
    ).toBe('BAD_USER_INPUT');
    expect(
      await codeOf(
        maAdminQueries.maRecordingChunkBase64(null, { meetingId, stream: 'SCREEN', seq: 0 }, ctx),
      ),
    ).toBe('BAD_USER_INPUT');
  });
});

describe('removing the screen recording', () => {
  it('goes with the meeting, and with the audio retention window', async () => {
    const gone = String((await seedMeeting(actor))._id);
    const kept = String((await seedMeeting(actor, { meetingCode: 'xyz-wxyz-xyz' }))._id);
    await save(gone, 0, pieceOf(1));
    await save(kept, 0, pieceOf(1));
    await save(kept, 1, pieceOf(2));

    await deleteMeetingData(gone);
    await setMaSettings({ audioRetentionDays: 5 });
    await files().updateOne(
      { 'metadata.meetingId': kept, 'metadata.seq': 0 },
      { $set: { uploadDate: new Date(Date.now() - 6 * DAY) } },
    );

    expect(await screenTracks(gone)).toEqual([]);
    expect(await runRetentionPass()).toBe(1);
    expect((await screenTracks(kept))[0].chunkCount).toBe(1);
  });

  it('ends a call with a screen recording but no transcript without a summary', async () => {
    const meeting = await seedMeeting(actor, { consentRecordedAt: new Date(), segmentCount: 0 });
    await save(String(meeting._id), 0, pieceOf(1));

    const ended = await finalizeSession(meeting, new Date());

    expect(ended).toMatchObject({ status: 'ENDED', summaryStatus: 'SKIPPED' });
    expect((await screenTracks(String(meeting._id)))[0].chunkCount).toBe(1);
  });
});
