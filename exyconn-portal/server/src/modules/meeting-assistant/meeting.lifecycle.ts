import { badRequest } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { MaGoogleConnectionModel, MaMeetingModel, type MaMeetingDocument } from './models';
import { getMaSettings } from './settings.service';
import { cancelQueuedJobs, enqueueMaJob } from './jobs.queue';
import { closeOpenAttendance, recordSelf } from './participants.service';
import type { CaptureState, TranscriptionState } from './ma.enums';
import type { MaActor } from './ma.access';

/** Google Meet's own code shape (the same as @exyconn/regex GOOGLE_MEET_CODE). */
const MEET_CODE = /^[a-z]{3}-[a-z]{4}-[a-z]{3}$/;
const MEET_ORIGIN = 'https://meet.google.com/';
/** A call left and rejoined within this long is the same session, not a new meeting. */
export const RECONNECT_WINDOW_MS = 15 * 60_000;
/** Google takes a few minutes after a call to produce its transcript. */
const OFFICIAL_IMPORT_DELAY_MS = 3 * 60_000;
/** A live session silent this long is a closed tab or a crashed browser. */
export const STALE_SESSION_MS = 10 * 60_000;

type LeanMeeting = MaMeetingDocument & { _id: unknown };

export interface StartSessionInput {
  meetingCode: string;
  url: string;
  title: string;
  timezone: string;
  startedAt: Date;
}

/** The input, checked: a real Meet code on a meet.google.com address. */
function checkedStart(input: StartSessionInput): StartSessionInput {
  const meetingCode = input.meetingCode.trim().toLowerCase();
  if (!MEET_CODE.test(meetingCode)) {
    badRequest('That is not a Google Meet meeting code.');
  }
  if (!input.url.startsWith(MEET_ORIGIN)) {
    badRequest('Only Google Meet calls can be recorded.');
  }
  return { ...input, meetingCode, title: input.title.trim().slice(0, 300) };
}

/** The ended call this one resumes, when the person rejoined within the reconnect window. */
function resumable(ownerId: string, meetingCode: string) {
  return MaMeetingModel.findOne({
    ownerId,
    meetingCode,
    status: 'ENDED',
    endedAt: { $gte: new Date(Date.now() - RECONNECT_WINDOW_MS) },
  }).sort({ endedAt: -1 });
}

/** The latest earlier call in the same series (recurring Meet calls keep their code). */
async function previousInSeries(meetingCode: string, before: Date): Promise<string | null> {
  const previous = await MaMeetingModel.findOne({
    meetingCode,
    status: 'ENDED',
    startedAt: { $lt: before },
  })
    .sort({ startedAt: -1 })
    .select('_id')
    .lean();
  return previous ? String(previous._id) : null;
}

async function createSession(actor: MaActor, input: StartSessionInput): Promise<LeanMeeting> {
  const settings = await getMaSettings();
  try {
    const created = await MaMeetingModel.create({
      sessionKey: `${actor.id}:${input.meetingCode}:${input.startedAt.getTime()}`,
      meetingCode: input.meetingCode,
      url: input.url,
      title: input.title,
      ownerId: actor.id,
      ownerName: actor.name,
      ownerEmail: actor.email,
      viewerIds: [actor.id],
      timezone: input.timezone,
      language: settings.preferredLanguage,
      startedAt: input.startedAt,
      lastHeartbeatAt: new Date(),
      previousMeetingId: await previousInSeries(input.meetingCode, input.startedAt),
    });
    return created.toObject() as LeanMeeting;
  } catch (error) {
    // Another tab won the race for this call's one live session: use theirs.
    const live = await MaMeetingModel.findOne({
      ownerId: actor.id,
      meetingCode: input.meetingCode,
      status: 'ACTIVE',
    }).lean<LeanMeeting>();
    if (live) {
      return live;
    }
    throw error;
  }
}

/**
 * Opens the caller's session for a call, or finds it again. Idempotent by design: a reload,
 * a reconnect, a second tab of the same call all land on the same row, so one call is never
 * saved twice.
 */
export async function startSession(actor: MaActor, raw: StartSessionInput): Promise<LeanMeeting> {
  const input = checkedStart(raw);
  const live = await MaMeetingModel.findOne({
    ownerId: actor.id,
    meetingCode: input.meetingCode,
    status: 'ACTIVE',
  }).lean<LeanMeeting>();
  if (live) {
    return live;
  }
  const ended = await resumable(actor.id, input.meetingCode);
  let meeting: LeanMeeting;
  if (ended) {
    await cancelQueuedJobs(ended._id.toHexString());
    ended.set({ status: 'ACTIVE', endedAt: null, lastHeartbeatAt: new Date() });
    await ended.save();
    meeting = ended.toObject() as LeanMeeting;
  } else {
    meeting = await createSession(actor, input);
  }
  await recordSelf(String(meeting._id), actor, new Date());
  return meeting;
}

export interface HeartbeatInput {
  transcriptionState: TranscriptionState;
  captureState: CaptureState;
  participantCount: number;
  title?: string | null;
}

/** What the extension sees right now. A heartbeat on an ended call changes nothing. */
export async function heartbeat(meeting: LeanMeeting, input: HeartbeatInput): Promise<LeanMeeting> {
  if (meeting.status !== 'ACTIVE') {
    return meeting;
  }
  const title = input.title?.trim();
  const updated = await MaMeetingModel.findByIdAndUpdate(
    meeting._id,
    {
      $set: {
        transcriptionState: input.transcriptionState,
        captureState: input.captureState,
        participantCount: Math.max(0, Math.min(input.participantCount, 1000)),
        lastHeartbeatAt: new Date(),
        ...(title ? { title: title.slice(0, 300) } : {}),
      },
    },
    { new: true },
  ).lean<LeanMeeting>();
  return updated ?? meeting;
}

/** The owner confirms the call was told it is being transcribed. Recorded once. */
export async function recordConsent(meeting: LeanMeeting): Promise<LeanMeeting> {
  if (meeting.consentRecordedAt) {
    return meeting;
  }
  const updated = await MaMeetingModel.findByIdAndUpdate(
    meeting._id,
    { $set: { consentRecordedAt: new Date() } },
    { new: true },
  ).lean<LeanMeeting>();
  return updated ?? meeting;
}

/** Queues what happens after a call: the official import first when Google is connected. */
async function queuePipeline(meeting: LeanMeeting): Promise<Partial<MaMeetingDocument>> {
  const meetingId = String(meeting._id);
  const connected = await MaGoogleConnectionModel.exists({ userId: meeting.ownerId });
  if (connected) {
    await enqueueMaJob('IMPORT_OFFICIAL', meetingId, {
      delayMs: OFFICIAL_IMPORT_DELAY_MS,
      maxAttempts: 8,
    });
    return { officialImportStatus: 'QUEUED' };
  }
  const settings = await getMaSettings();
  if (!settings.autoGenerateSummary) {
    return { officialImportStatus: 'SKIPPED' };
  }
  if (meeting.segmentCount === 0) {
    // Nothing was transcribed, so there is nothing to summarise — never a made-up summary.
    return { officialImportStatus: 'SKIPPED', summaryStatus: 'SKIPPED' };
  }
  await enqueueMaJob('ANALYZE', meetingId);
  return { officialImportStatus: 'SKIPPED', summaryStatus: 'QUEUED' };
}

/**
 * Ends the call and queues the after-meeting pipeline. Idempotent: finalizing an ended call
 * returns it unchanged, so the extension can retry freely after a network failure.
 */
export async function finalizeSession(
  meeting: LeanMeeting,
  endedAtRaw: Date,
): Promise<LeanMeeting> {
  if (meeting.status === 'ENDED') {
    return meeting;
  }
  const startedAt = new Date(meeting.startedAt);
  const endedAt = new Date(
    Math.min(Date.now(), Math.max(endedAtRaw.getTime(), startedAt.getTime())),
  );
  const claimed = await MaMeetingModel.findOneAndUpdate(
    { _id: meeting._id, status: 'ACTIVE' },
    {
      $set: {
        status: 'ENDED',
        endedAt,
        captureState: meeting.captureState === 'ERROR' ? 'ERROR' : 'STOPPED',
      },
    },
    { new: true },
  ).lean<LeanMeeting>();
  if (!claimed) {
    // A concurrent finalize got there first.
    return (await MaMeetingModel.findById(meeting._id).lean<LeanMeeting>()) ?? meeting;
  }
  await closeOpenAttendance(String(meeting._id), endedAt);
  const steps = await queuePipeline(claimed);
  const updated = await MaMeetingModel.findByIdAndUpdate(
    claimed._id,
    { $set: steps },
    { new: true },
  ).lean<LeanMeeting>();
  return updated ?? claimed;
}

/**
 * Ends sessions whose browser went silent — a closed laptop, a crashed tab — at their last
 * heartbeat, so a call that never said goodbye is still summarised. Returns how many.
 */
export async function recoverStaleSessions(now = new Date()): Promise<number> {
  const stale = await MaMeetingModel.find({
    status: 'ACTIVE',
    lastHeartbeatAt: { $lt: new Date(now.getTime() - STALE_SESSION_MS) },
  })
    .limit(50)
    .lean<LeanMeeting[]>();
  await Promise.all(
    stale.map(async (meeting) => {
      await finalizeSession(meeting, new Date(meeting.lastHeartbeatAt ?? meeting.startedAt));
      logger.info(
        { meetingId: String(meeting._id) },
        'Meeting assistant: finalized a silent session',
      );
    }),
  );
  return stale.length;
}
