import { useTestOrganization } from '../../../helpers';
import { openAiClient } from '../../../../src/utils/openai';
import { sendTemplateEmail } from '../../../../src/modules/email/email.service';
import { readGoogleConfig } from '../../../../src/modules/auth/google/google-sign-in.config';
import { seal } from '../../../../src/utils/secretBox';
import { readJobRuns, clearJobRuns, JOB_KEYS } from '../../../../src/utils/jobHeartbeat';
import {
  requeueAbandonedJobs,
  runNextMaJob,
} from '../../../../src/modules/meeting-assistant/jobs.runner';
import {
  runPipelinePass,
  runRetentionPass,
  startMeetingAssistantWorker,
} from '../../../../src/modules/meeting-assistant/ma.worker';
import { enqueueMaJob } from '../../../../src/modules/meeting-assistant/jobs.queue';
import {
  saveChunk,
  recordingTracks,
} from '../../../../src/modules/meeting-assistant/recording.store';
import { displayNameOf } from '../../../../src/modules/meeting-assistant/google-meet.client';
import { matchRecord } from '../../../../src/modules/meeting-assistant/google-meet.import';
import {
  MaActionItemModel,
  MaChunkModel,
  MaDecisionModel,
  MaEventModel,
  MaGoogleConnectionModel,
  MaJobModel,
  MaMeetingModel,
  MaNotesModel,
  MaParticipantModel,
  MaSegmentModel,
} from '../../../../src/modules/meeting-assistant/models';
import { AuditLogModel } from '../../../../src/modules/audit';
import {
  actorNamed,
  seedMeeting,
  seedOpenAiConfig,
  setMaSettings,
  wavOf,
  type LeanMeeting,
} from './ma.fixtures';

jest.mock('../../../../src/utils/openai', () => ({
  ...jest.requireActual('../../../../src/utils/openai'),
  openAiClient: { complete: jest.fn() },
}));
jest.mock('../../../../src/modules/email/email.service', () => ({
  sendTemplateEmail: jest.fn(),
  renderStoredTemplate: jest.fn(),
}));
jest.mock('../../../../src/modules/auth/google/google-sign-in.config', () => ({
  readGoogleConfig: jest.fn(),
}));

const complete = openAiClient.complete as jest.Mock;
const send = sendTemplateEmail as jest.Mock;

useTestOrganization();

const owner = actorNamed('Asha');
const MINUTE = 60_000;
const DAY = 86_400_000;
const STARTED = new Date(Date.now() - 60 * MINUTE);
const RECORD = 'conferenceRecords/r1';
const PERSON = `${RECORD}/participants/p1`;

const analysisReply = {
  text: JSON.stringify({
    overview: 'Planned the launch',
    decisions: [{ text: 'Launch on Monday', evidence: [0], confidence: 0.9 }],
    actionItems: [{ title: 'Send the deck', owner: 'Asha', evidence: [0], confidence: 0.8 }],
  }),
  promptTokens: 1000,
  completionTokens: 200,
  totalTokens: 1200,
};

async function endedMeeting(overrides: Record<string, unknown> = {}): Promise<LeanMeeting> {
  const meeting = await seedMeeting(owner, {
    status: 'ENDED',
    startedAt: STARTED,
    endedAt: new Date(STARTED.getTime() + 30 * MINUTE),
    segmentCount: 1,
    ...overrides,
  });
  await MaSegmentModel.create({
    meetingId: String(meeting._id),
    source: 'AI',
    stream: 'MIC',
    chunkSeq: 0,
    index: 0,
    startMs: 0,
    endMs: 1000,
    text: 'I will send the deck, we launch Monday',
    speakerLabel: 'Asha (microphone)',
  });
  return meeting;
}

const jobOf = async (meeting: LeanMeeting, kind: string) =>
  MaJobModel.findOne({ meetingId: String(meeting._id), kind }).lean();
const meetingNow = async (meeting: LeanMeeting) => MaMeetingModel.findById(meeting._id).lean();
/** A clock far enough ahead that every queued step is due. */
const later = (ms = DAY) => new Date(Date.now() + ms);

beforeAll(async () => {
  await Promise.all([MaJobModel.init(), MaSegmentModel.init(), MaDecisionModel.init()]);
});

beforeEach(async () => {
  (readGoogleConfig as jest.Mock).mockResolvedValue({ clientId: 'id', clientSecret: 'secret' });
  send.mockResolvedValue(undefined);
  await seedOpenAiConfig();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('claiming steps', () => {
  it('runs nothing when no step is due', async () => {
    const meeting = await endedMeeting();
    await enqueueMaJob('ANALYZE', String(meeting._id), { delayMs: MINUTE });

    expect(await runNextMaJob()).toBe(false);
    expect((await jobOf(meeting, 'ANALYZE'))?.status).toBe('QUEUED');
  });

  it('fails a step whose meeting was deleted', async () => {
    await enqueueMaJob('ANALYZE', '6ad7b0d2f428c577485bfbf3');

    expect(await runNextMaJob()).toBe(true);
    expect(await MaJobModel.findOne().lean()).toMatchObject({
      status: 'FAILED',
      lastError: 'Meeting deleted',
    });
  });

  it('lets only one of two racing ticks take a step', async () => {
    const meeting = await endedMeeting();
    await enqueueMaJob('ANALYZE', String(meeting._id));
    complete.mockResolvedValue(analysisReply);

    const ran = await Promise.all([runNextMaJob(), runNextMaJob()]);

    expect(ran.filter(Boolean)).toHaveLength(1);
    expect(complete).toHaveBeenCalledTimes(1);
  });
});

describe('writing notes', () => {
  it('writes notes, decisions and the checklist, and marks the summary ready', async () => {
    const meeting = await endedMeeting();
    await MaParticipantModel.create({
      meetingId: String(meeting._id),
      key: `user:${owner.id}`,
      displayName: 'Asha',
      email: owner.email,
      userId: owner.id,
      source: 'EXTENSION_USER',
    });
    await enqueueMaJob('ANALYZE', String(meeting._id));
    complete.mockResolvedValue(analysisReply);

    expect(await runNextMaJob()).toBe(true);

    expect(await meetingNow(meeting)).toMatchObject({
      summaryStatus: 'READY',
      emailStatus: 'NOT_SENT',
    });
    expect((await MaNotesModel.findOne().lean())?.content.overview).toBe('Planned the launch');
    expect(await MaDecisionModel.countDocuments()).toBe(1);
    expect(await MaActionItemModel.findOne().lean()).toMatchObject({
      assignedTo: 'Asha',
      assignedUserId: owner.id,
      needsConfirmation: true,
    });
    expect((await jobOf(meeting, 'ANALYZE'))?.status).toBe('DONE');
    expect(
      await AuditLogModel.countDocuments({ action: 'CREATE', module: 'Meeting Assistant' }),
    ).toBe(1);
  });

  it('waits for approval before emailing when the company asks for it', async () => {
    await setMaSettings({ autoEmail: true, emailRequiresApproval: true });
    const meeting = await endedMeeting();
    await enqueueMaJob('ANALYZE', String(meeting._id));
    complete.mockResolvedValue(analysisReply);

    await runNextMaJob();

    expect((await meetingNow(meeting))?.emailStatus).toBe('AWAITING_APPROVAL');
    expect(await jobOf(meeting, 'EMAIL')).toBeNull();
  });

  it('queues the email straight away without approval, and sends it on the next step', async () => {
    await setMaSettings({ autoEmail: true, emailRequiresApproval: false });
    const meeting = await endedMeeting();
    await enqueueMaJob('ANALYZE', String(meeting._id), { style: 'SHORT' });
    complete.mockResolvedValue(analysisReply);

    await runNextMaJob();
    expect((await meetingNow(meeting))?.emailStatus).toBe('QUEUED');
    expect((await jobOf(meeting, 'EMAIL'))?.key).toBe(`email:${String(meeting._id)}:1`);
    expect((await MaNotesModel.findOne().lean())?.style).toBe('SHORT');

    await runNextMaJob();

    expect(send).toHaveBeenCalledWith(expect.objectContaining({ to: owner.email }));
    expect((await meetingNow(meeting))?.emailStatus).toBe('SENT');
    expect((await jobOf(meeting, 'EMAIL'))?.status).toBe('DONE');
  });

  it('retries a step with a doubling back-off and gives up after its attempts', async () => {
    const meeting = await endedMeeting();
    await enqueueMaJob('ANALYZE', String(meeting._id));
    complete.mockRejectedValue(new Error('model offline'));

    await runNextMaJob();
    const first = await jobOf(meeting, 'ANALYZE');
    expect(first).toMatchObject({ status: 'QUEUED', attempts: 1, lastError: 'model offline' });
    expect(first!.runAfter.getTime()).toBeGreaterThan(Date.now() + 0.9 * MINUTE);

    await runNextMaJob(later());
    const second = await jobOf(meeting, 'ANALYZE');
    expect(second!.runAfter.getTime()).toBeGreaterThan(Date.now() + 1.9 * MINUTE);

    await runNextMaJob(later());
    expect(await jobOf(meeting, 'ANALYZE')).toMatchObject({ status: 'FAILED', attempts: 3 });
    expect(await meetingNow(meeting)).toMatchObject({
      summaryStatus: 'FAILED',
      summaryError: 'model offline',
    });
  });

  it('refuses to spend past the monthly budget', async () => {
    await setMaSettings({ monthlyBudgetUsd: 1 });
    const meeting = await endedMeeting({ costUsd: 5, startedAt: new Date() });
    await enqueueMaJob('ANALYZE', String(meeting._id));

    await runNextMaJob();

    expect((await jobOf(meeting, 'ANALYZE'))?.lastError).toBe(
      'The monthly AI budget for meetings is spent.',
    );
    expect(complete).not.toHaveBeenCalled();
  });

  it('retries an email step while a recipient keeps failing', async () => {
    const meeting = await endedMeeting();
    await MaNotesModel.create({
      meetingId: String(meeting._id),
      style: 'DETAILED',
      model: 'gpt-4o',
      generatedAt: new Date(),
      original: {},
      content: {},
    });
    await enqueueMaJob('EMAIL', String(meeting._id), { round: 1 });
    send.mockRejectedValue(new Error('SMTP down'));

    await runNextMaJob();

    expect(await jobOf(meeting, 'EMAIL')).toMatchObject({
      status: 'QUEUED',
      lastError: '1 summary email(s) failed',
    });
  });
});

/** Answers the Google token and Meet API calls the import makes, from a route table. */
function fakeGoogle(routes: Record<string, unknown>, status = 200) {
  return jest.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = String(input);
    if (url.startsWith('https://oauth2.googleapis.com/token')) {
      return new Response(JSON.stringify({ access_token: 'access' }));
    }
    const path = new URL(url).pathname.replace('/v2/', '');
    const page = new URL(url).searchParams.get('pageToken') ?? '';
    const body = routes[`${path}${page ? `#${page}` : ''}`] ?? {};
    return new Response(JSON.stringify(body), { status });
  });
}

const at = (minutes: number) => new Date(STARTED.getTime() + minutes * MINUTE).toISOString();

const officialRoutes = (overrides: Record<string, unknown> = {}) => ({
  conferenceRecords: {
    conferenceRecords: [
      { name: 'conferenceRecords/far', startTime: at(-120), endTime: at(-90) },
      { name: RECORD, startTime: at(1), endTime: at(30) },
    ],
  },
  [`${RECORD}/transcripts`]: {
    transcripts: [{ name: `${RECORD}/transcripts/t1`, state: 'FILE_GENERATED' }],
  },
  [`${RECORD}/participants`]: {
    participants: [{ name: PERSON, signedinUser: { displayName: 'Asha Rao' } }],
    nextPageToken: 'p2',
  },
  [`${RECORD}/participants#p2`]: {
    participants: [{ name: `${RECORD}/participants/p2`, phoneUser: { displayName: 'Phone' } }],
  },
  [`${PERSON}/participantSessions`]: {
    participantSessions: [{ startTime: at(1), endTime: at(20) }, {}],
  },
  [`${RECORD}/transcripts/t1/entries`]: {
    transcriptEntries: [
      {
        participant: PERSON,
        text: ' Hello team ',
        languageCode: 'en',
        startTime: at(2),
        endTime: at(3),
      },
      { participant: PERSON, text: '   ' },
    ],
  },
  ...overrides,
});

describe('importing Google’s official record', () => {
  const connect = () =>
    MaGoogleConnectionModel.create({
      userId: owner.id,
      email: 'asha@gmail.com',
      refreshToken: seal('refresh'),
    });

  it('replaces participants and transcript with Google’s, then queues the notes', async () => {
    const meeting = await endedMeeting();
    await connect();
    await enqueueMaJob('IMPORT_OFFICIAL', String(meeting._id));
    fakeGoogle(officialRoutes());

    await runNextMaJob();

    expect(await meetingNow(meeting)).toMatchObject({
      officialImportStatus: 'READY',
      summaryStatus: 'QUEUED',
      transcriptionState: 'ON',
      participantCount: 2,
      segmentCount: 2,
    });
    const official = await MaSegmentModel.find({ source: 'GOOGLE_MEET' }).lean();
    expect(official.map((row) => [row.text, row.speakerLabel, row.startMs])).toEqual([
      ['Hello team', 'Asha Rao', 2 * MINUTE],
    ]);
    const people = await MaParticipantModel.find().sort({ displayName: 1 }).lean();
    expect(people.map((row) => [row.displayName, row.totalSeconds])).toEqual([
      ['Asha Rao', 19 * 60],
      ['Phone', 0],
    ]);
    expect((await jobOf(meeting, 'ANALYZE'))?.status).toBe('QUEUED');
  });

  it('waits and tries again while Google is still producing the record or transcript', async () => {
    const meeting = await endedMeeting();
    await connect();
    await enqueueMaJob('IMPORT_OFFICIAL', String(meeting._id), { maxAttempts: 8 });
    fakeGoogle(
      officialRoutes({
        conferenceRecords: { conferenceRecords: [{ name: RECORD, startTime: at(1) }] },
      }),
    );

    await runNextMaJob();

    const job = await jobOf(meeting, 'IMPORT_OFFICIAL');
    expect(job).toMatchObject({
      status: 'QUEUED',
      lastError: 'Google has not finished the conference record yet.',
    });
    expect(job!.runAfter.getTime()).toBeGreaterThan(Date.now() + 9 * MINUTE);

    jest.restoreAllMocks();
    fakeGoogle(
      officialRoutes({
        [`${RECORD}/transcripts`]: { transcripts: [{ name: 't', state: 'STARTED' }] },
      }),
    );
    await runNextMaJob(later());
    expect((await jobOf(meeting, 'IMPORT_OFFICIAL'))?.lastError).toBe(
      'Google is still producing the transcript.',
    );
  });

  it('imports untimed lines and people still in the call', async () => {
    const meeting = await endedMeeting();
    await connect();
    await enqueueMaJob('IMPORT_OFFICIAL', String(meeting._id));
    fakeGoogle(
      officialRoutes({
        [`${PERSON}/participantSessions`]: { participantSessions: [{ startTime: at(5) }] },
        [`${RECORD}/transcripts/t1/entries`]: { transcriptEntries: [{ text: 'no timing' }] },
      }),
    );

    await runNextMaJob();

    expect(await MaSegmentModel.findOne({ source: 'GOOGLE_MEET' }).lean()).toMatchObject({
      text: 'no timing',
      startMs: 0,
      endMs: 0,
      language: null,
      speakerLabel: null,
    });
    expect((await MaParticipantModel.findOne({ displayName: 'Asha Rao' }).lean())?.status).toBe(
      'UNKNOWN',
    );
  });

  it('reports transcription off when Google made no transcript', async () => {
    const meeting = await endedMeeting();
    await connect();
    await enqueueMaJob('IMPORT_OFFICIAL', String(meeting._id));
    fakeGoogle(officialRoutes({ [`${RECORD}/transcripts`]: {} }));

    await runNextMaJob();

    expect(await meetingNow(meeting)).toMatchObject({
      transcriptionState: 'OFF',
      officialImportStatus: 'READY',
    });
  });

  it('names the HTTP status when Google refuses the token without a reason', async () => {
    const meeting = await endedMeeting();
    await connect();
    await enqueueMaJob('IMPORT_OFFICIAL', String(meeting._id));
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 503 }));

    await runNextMaJob();

    expect((await MaGoogleConnectionModel.findOne().lean())?.lastError).toContain('(503)');
  });

  it('records a refused Google token on the connection', async () => {
    const meeting = await endedMeeting();
    await connect();
    await enqueueMaJob('IMPORT_OFFICIAL', String(meeting._id));
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ error: 'invalid_grant' }), { status: 400 }));

    await runNextMaJob();

    expect((await MaGoogleConnectionModel.findOne().lean())?.lastError).toContain('invalid_grant');
  });

  it('summarises our own transcript when the import finally gives up', async () => {
    const meeting = await endedMeeting();
    await connect();
    await enqueueMaJob('IMPORT_OFFICIAL', String(meeting._id), { maxAttempts: 1 });
    fakeGoogle({}, 500);

    await runNextMaJob();

    expect(await meetingNow(meeting)).toMatchObject({
      officialImportStatus: 'FAILED',
      summaryStatus: 'QUEUED',
    });
    expect((await jobOf(meeting, 'IMPORT_OFFICIAL'))?.lastError).toContain('Google Meet API 500');
  });

  it('skips the notes when neither transcript has a line, and fails without a connection', async () => {
    const meeting = await seedMeeting(owner, { status: 'ENDED', startedAt: STARTED });
    await enqueueMaJob('IMPORT_OFFICIAL', String(meeting._id), { maxAttempts: 1 });

    await runNextMaJob();

    expect(await meetingNow(meeting)).toMatchObject({
      officialImportStatus: 'FAILED',
      summaryStatus: 'SKIPPED',
    });
    expect((await jobOf(meeting, 'IMPORT_OFFICIAL'))?.lastError).toBe(
      'The meeting owner has not connected Google Meet.',
    );
  });

  it('names a participant whatever kind of user they were, and matches the nearest record', () => {
    expect(displayNameOf({ name: 'a', anonymousUser: { displayName: 'Guest' } })).toBe('Guest');
    expect(displayNameOf({ name: 'b' })).toBe('Unknown participant');
    expect(matchRecord([{ name: 'x', startTime: at(-90) }], STARTED)).toBeNull();
    expect(
      matchRecord(
        [
          { name: 'x', startTime: at(10) },
          { name: 'y', startTime: at(-2) },
        ],
        STARTED,
      )?.name,
    ).toBe('y');
  });
});

describe('the worker', () => {
  it('requeues steps a dead process left running, and only those', async () => {
    await MaJobModel.create([
      { key: 'a', kind: 'ANALYZE', meetingId: 'm1', status: 'RUNNING', runAfter: new Date() },
      { key: 'b', kind: 'ANALYZE', meetingId: 'm2', status: 'RUNNING', runAfter: new Date() },
    ]);
    await MaJobModel.collection.updateOne(
      { key: 'a' },
      { $set: { updatedAt: new Date(Date.now() - 20 * MINUTE) } },
    );

    expect(await requeueAbandonedJobs()).toBe(1);
    expect((await MaJobModel.findOne({ key: 'a' }).lean())?.status).toBe('QUEUED');
    expect((await MaJobModel.findOne({ key: 'b' }).lean())?.status).toBe('RUNNING');
  });

  it('recovers silent sessions and runs what is due in one pass', async () => {
    await seedMeeting(owner, {
      lastHeartbeatAt: new Date(Date.now() - 30 * MINUTE),
      segmentCount: 0,
    });
    const meeting = await endedMeeting({ meetingCode: 'xyz-wxyz-xyz' });
    await enqueueMaJob('ANALYZE', String(meeting._id));
    complete.mockResolvedValue(analysisReply);

    expect(await runPipelinePass()).toBe(1);
    expect(await MaMeetingModel.countDocuments({ status: 'ACTIVE' })).toBe(0);
  });

  it('deletes only what has outlived the retention windows', async () => {
    await setMaSettings({ transcriptRetentionDays: 10, audioRetentionDays: 5 });
    const meeting = await endedMeeting();
    const meetingId = String(meeting._id);
    await MaSegmentModel.collection.updateMany(
      {},
      { $set: { createdAt: new Date(Date.now() - 11 * DAY) } },
    );
    await MaChunkModel.create({ meetingId, stream: 'MIC', seq: 0, status: 'DONE' });
    await MaEventModel.create({ meetingId, type: 'X', message: 'fresh' });
    await saveChunk({ meetingId, stream: 'MIC', seq: 0 }, wavOf(64), 2);
    await saveChunk({ meetingId, stream: 'MIC', seq: 1 }, wavOf(64), 2);
    await MaMeetingModel.db
      .collection('ma_recordings.files')
      .updateOne({ 'metadata.seq': 0 }, { $set: { uploadDate: new Date(Date.now() - 6 * DAY) } });

    expect(await runRetentionPass()).toBe(2);
    expect(await MaSegmentModel.countDocuments()).toBe(0);
    expect(await MaChunkModel.countDocuments()).toBe(1);
    expect(await MaEventModel.countDocuments()).toBe(1);
    expect((await recordingTracks(meetingId))[0].chunkCount).toBe(1);
  });

  it('keeps everything when the retention windows are zero', async () => {
    await setMaSettings({ transcriptRetentionDays: 0, audioRetentionDays: 0 });
    await endedMeeting();
    await MaSegmentModel.collection.updateMany(
      {},
      { $set: { createdAt: new Date(Date.now() - 999 * DAY) } },
    );

    expect(await runRetentionPass()).toBe(0);
    expect(await MaSegmentModel.countDocuments()).toBe(1);
  });

  it('starts the pipeline and the retention sweep for every company, on timers that never hold the process', async () => {
    clearJobRuns();
    const unref = jest.fn();
    const timer = jest.spyOn(globalThis, 'setInterval').mockReturnValue({ unref } as never);

    startMeetingAssistantWorker();

    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(timer.mock.calls.map((call) => call[1])).toEqual([15_000, 3_600_000]);
    expect(unref).toHaveBeenCalledTimes(2);
    expect(readJobRuns().get(JOB_KEYS.meetingAssistant)?.summary).toBe('Nothing due');
    expect(readJobRuns().get(JOB_KEYS.meetingAssistantRetention)?.summary).toBe(
      'Removed 0 expired record(s)',
    );
  });
});
