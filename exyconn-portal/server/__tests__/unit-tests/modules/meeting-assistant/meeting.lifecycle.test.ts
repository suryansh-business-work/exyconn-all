import {
  finalizeSession,
  heartbeat,
  recordConsent,
  recoverStaleSessions,
  RECONNECT_WINDOW_MS,
  STALE_SESSION_MS,
  startSession,
  type StartSessionInput,
} from '../../../../src/modules/meeting-assistant/meeting.lifecycle';
import { enqueueMaJob } from '../../../../src/modules/meeting-assistant/jobs.queue';
import {
  MaGoogleConnectionModel,
  MaJobModel,
  MaMeetingModel,
  MaParticipantModel,
} from '../../../../src/modules/meeting-assistant/models';
import { codeOf } from '../codeOf';
import { actorNamed, seedMeeting, setMaSettings } from './ma.fixtures';

const owner = actorNamed('Ravi');

const input = (overrides: Partial<StartSessionInput> = {}): StartSessionInput => ({
  meetingCode: 'abc-defg-hij',
  url: 'https://meet.google.com/abc-defg-hij',
  title: '  Planning  ',
  timezone: 'Asia/Kolkata',
  startedAt: new Date(Date.now() - 1000),
  ...overrides,
});

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000);

beforeAll(async () => {
  // The partial unique index on live sessions is what settles two tabs racing.
  await Promise.all([MaMeetingModel.init(), MaParticipantModel.init(), MaJobModel.init()]);
});

describe('starting a session', () => {
  it('refuses anything that is not a Google Meet call', async () => {
    expect(await codeOf(startSession(owner, input({ meetingCode: 'not-a-code' })))).toBe(
      'BAD_USER_INPUT',
    );
    expect(await codeOf(startSession(owner, input({ url: 'https://zoom.us/j/1' })))).toBe(
      'BAD_USER_INPUT',
    );
    expect(await MaMeetingModel.countDocuments()).toBe(0);
  });

  it('opens one session, normalising the code and the title, and records the user as present', async () => {
    const meeting = await startSession(owner, input({ meetingCode: ' ABC-DEFG-HIJ ' }));

    expect(meeting).toMatchObject({
      meetingCode: 'abc-defg-hij',
      title: 'Planning',
      status: 'ACTIVE',
      ownerId: owner.id,
      viewerIds: [owner.id],
      previousMeetingId: null,
    });
    const self = await MaParticipantModel.findOne({ meetingId: String(meeting._id) }).lean();
    expect(self).toMatchObject({
      key: `user:${owner.id}`,
      source: 'EXTENSION_USER',
      email: owner.email,
      userId: owner.id,
      status: 'JOINED',
    });
  });

  it('finds the same row again on a reload', async () => {
    const first = await startSession(owner, input());
    const again = await startSession(owner, input({ startedAt: new Date() }));

    expect(String(again._id)).toBe(String(first._id));
    expect(await MaMeetingModel.countDocuments()).toBe(1);
  });

  it('leaves two tabs racing to start the same call with one live session', async () => {
    const [a, b] = await Promise.all([startSession(owner, input()), startSession(owner, input())]);

    expect(String(a._id)).toBe(String(b._id));
    expect(await MaMeetingModel.countDocuments({ status: 'ACTIVE' })).toBe(1);
    expect(await MaParticipantModel.countDocuments()).toBe(1);
  });

  it('keeps another person on the same call as a separate session', async () => {
    const mine = await startSession(owner, input());
    const theirs = await startSession(actorNamed('Meera'), input());

    expect(String(theirs._id)).not.toBe(String(mine._id));
  });

  it('resumes a call ended within the reconnect window and drops its queued steps', async () => {
    const ended = await seedMeeting(owner, {
      status: 'ENDED',
      endedAt: new Date(Date.now() - RECONNECT_WINDOW_MS + 60_000),
    });
    const meetingId = String(ended._id);
    await enqueueMaJob('ANALYZE', meetingId);
    await MaJobModel.create({
      key: `done:${meetingId}`,
      kind: 'EMAIL',
      meetingId,
      status: 'DONE',
      runAfter: new Date(),
    });

    const resumed = await startSession(owner, input());

    expect(String(resumed._id)).toBe(meetingId);
    expect(resumed.status).toBe('ACTIVE');
    expect(resumed.endedAt).toBeNull();
    expect(await MaJobModel.find({ meetingId }).distinct('status')).toEqual(['DONE']);
  });

  it('starts a new meeting after the window, linked to the earlier one in the series', async () => {
    const earlier = await seedMeeting(owner, {
      status: 'ENDED',
      startedAt: minutesAgo(60),
      endedAt: new Date(Date.now() - RECONNECT_WINDOW_MS - 60_000),
    });

    const next = await startSession(owner, input());

    expect(String(next._id)).not.toBe(String(earlier._id));
    expect(next.previousMeetingId).toBe(String(earlier._id));
  });
});

describe('heartbeat and consent', () => {
  it('records what the extension sees, bounding the participant count', async () => {
    const meeting = await seedMeeting(owner);
    const before = meeting.lastHeartbeatAt as Date;

    const high = await heartbeat(meeting, {
      transcriptionState: 'ON',
      captureState: 'RECORDING',
      participantCount: 5000,
      title: '  Renamed  ',
    });
    const low = await heartbeat(meeting, {
      transcriptionState: 'OFF',
      captureState: 'PAUSED',
      participantCount: -3,
      title: '   ',
    });

    expect(high).toMatchObject({
      transcriptionState: 'ON',
      captureState: 'RECORDING',
      participantCount: 1000,
      title: 'Renamed',
    });
    expect(low).toMatchObject({ participantCount: 0, title: 'Renamed', captureState: 'PAUSED' });
    expect((low.lastHeartbeatAt as Date).getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  it('changes nothing on an ended call', async () => {
    const meeting = await seedMeeting(owner, { status: 'ENDED', endedAt: new Date() });

    const after = await heartbeat(meeting, {
      transcriptionState: 'ON',
      captureState: 'RECORDING',
      participantCount: 4,
    });

    expect(after).toBe(meeting);
    expect((await MaMeetingModel.findById(meeting._id).lean())?.captureState).toBe('IDLE');
  });

  it('records consent once and keeps the first time', async () => {
    const meeting = await seedMeeting(owner);

    const first = await recordConsent(meeting);
    const second = await recordConsent(first);

    expect(first.consentRecordedAt).toBeInstanceOf(Date);
    expect(second.consentRecordedAt).toEqual(first.consentRecordedAt);
  });
});

describe('finalizing a session', () => {
  it('ends the call once, queuing the notes when there is a transcript', async () => {
    const meeting = await seedMeeting(owner, { segmentCount: 4 });

    const ended = await finalizeSession(meeting, new Date());
    const again = await finalizeSession(ended, new Date());

    expect(ended).toMatchObject({
      status: 'ENDED',
      captureState: 'STOPPED',
      officialImportStatus: 'SKIPPED',
      summaryStatus: 'QUEUED',
    });
    expect(again).toBe(ended);
    const jobs = await MaJobModel.find({ meetingId: String(meeting._id) }).lean();
    expect(jobs.map((job) => [job.kind, job.status])).toEqual([['ANALYZE', 'QUEUED']]);
  });

  it('returns the stored row to a finalize that lost the race', async () => {
    const meeting = await seedMeeting(owner, { segmentCount: 1 });

    const [a, b] = await Promise.all([
      finalizeSession(meeting, new Date()),
      finalizeSession(meeting, new Date()),
    ]);

    expect([a.status, b.status]).toEqual(['ENDED', 'ENDED']);
    expect(await MaJobModel.countDocuments()).toBe(1);
  });

  it('clamps the end between the start and now', async () => {
    const startedAt = minutesAgo(30);
    const early = await seedMeeting(owner, { startedAt });
    const late = await seedMeeting(owner, { meetingCode: 'xyz-wxyz-xyz' });

    const endedEarly = await finalizeSession(early, minutesAgo(90));
    const endedLate = await finalizeSession(late, new Date(Date.now() + 3_600_000));

    expect(endedEarly.endedAt).toEqual(startedAt);
    expect((endedLate.endedAt as Date).getTime()).toBeLessThanOrEqual(Date.now());
  });

  it('closes the attendance of everyone still in the call at its end', async () => {
    const meeting = await startSession(owner, input({ startedAt: minutesAgo(10) }));
    await MaParticipantModel.updateOne(
      { meetingId: String(meeting._id) },
      { $set: { 'sessions.0.joinedAt': minutesAgo(10) } },
    );

    await finalizeSession(meeting, minutesAgo(4));

    const self = await MaParticipantModel.findOne({ meetingId: String(meeting._id) }).lean();
    expect(self?.status).toBe('LEFT');
    expect(self?.totalSeconds).toBe(360);
  });

  it('summarises nothing when nothing was transcribed', async () => {
    const meeting = await seedMeeting(owner, { captureState: 'ERROR' });

    const ended = await finalizeSession(meeting, new Date());

    expect(ended).toMatchObject({
      captureState: 'ERROR',
      officialImportStatus: 'SKIPPED',
      summaryStatus: 'SKIPPED',
    });
    expect(await MaJobModel.countDocuments()).toBe(0);
  });

  it('queues nothing when automatic notes are switched off', async () => {
    await setMaSettings({ autoGenerateSummary: false });
    const meeting = await seedMeeting(owner, { segmentCount: 9 });

    const ended = await finalizeSession(meeting, new Date());

    expect(ended).toMatchObject({ officialImportStatus: 'SKIPPED', summaryStatus: 'NOT_STARTED' });
    expect(await MaJobModel.countDocuments()).toBe(0);
  });

  it('waits for Google’s official record first when the owner connected Google Meet', async () => {
    await MaGoogleConnectionModel.create({
      userId: owner.id,
      email: owner.email,
      refreshToken: 'sealed',
    });
    const meeting = await seedMeeting(owner, { segmentCount: 3 });

    const ended = await finalizeSession(meeting, new Date());

    expect(ended.officialImportStatus).toBe('QUEUED');
    expect(ended.summaryStatus).toBe('NOT_STARTED');
    const job = await MaJobModel.findOne({ meetingId: String(meeting._id) }).lean();
    expect(job).toMatchObject({ kind: 'IMPORT_OFFICIAL', maxAttempts: 8 });
    expect(job!.runAfter.getTime()).toBeGreaterThan(Date.now() + 2 * 60_000);
  });
});

describe('recovering silent sessions', () => {
  it('ends only the sessions whose browser went silent, at their last heartbeat', async () => {
    const lastHeard = new Date(Date.now() - STALE_SESSION_MS - 60_000);
    const silent = await seedMeeting(owner, {
      lastHeartbeatAt: lastHeard,
      startedAt: minutesAgo(40),
    });
    const alive = await seedMeeting(owner, {
      meetingCode: 'xyz-wxyz-xyz',
      lastHeartbeatAt: minutesAgo(1),
    });

    expect(await recoverStaleSessions()).toBe(1);

    const stored = await MaMeetingModel.findById(silent._id).lean();
    expect(stored?.status).toBe('ENDED');
    expect(stored?.endedAt).toEqual(lastHeard);
    expect((await MaMeetingModel.findById(alive._id).lean())?.status).toBe('ACTIVE');
    expect(await recoverStaleSessions()).toBe(0);
  });
});
