import { cp, mkdir, readFile, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import type { BrowserContext, Page } from 'playwright-core';
import { report, Session, type Assignment } from './api';
import { config } from './config';
import { openStage, type Stage } from './display';
import { errorText, log } from './log';
import { askToJoin, callState, leave, openBrowser, othersInCall, postInChat } from './meet';
import { startRecorder, type Recorder } from './recorder';
import { UploadQueue } from './uploads';

const CHECK_MS = 15_000;
/** How long the host has to admit the bot. */
const ADMIT_MS = 10 * 60_000;
/** The bot leaves once it has been alone in the call this long. */
const ALONE_MS = 2 * 60_000;
const VIDEO_MIME = 'video/webm;codecs=h264,opus';

const START = `mutation ($input: MaStartSessionInput!) { maStartSession(input: $input) { id } }`;
const CONSENT = `mutation ($meetingId: ID!) { maRecordConsent(meetingId: $meetingId) { id } }`;
const BEAT = `mutation ($meetingId: ID!, $input: MaHeartbeatInput!) { maHeartbeat(meetingId: $meetingId, input: $input) { id } }`;
const FINALIZE = `mutation ($meetingId: ID!, $endedAt: DateTime!) { maFinalizeSession(meetingId: $meetingId, endedAt: $endedAt) { id } }`;

const wait = (ms: number) => new Promise((resolve) => globalThis.setTimeout(resolve, ms));

/** A copy of the signed-in profile for this trip: one Chrome profile cannot be open twice. */
async function tripProfile(dir: string): Promise<string> {
  const profile = path.join(dir, 'profile');
  const signedIn = await stat(config.profileDir).then(
    (info) => info.isDirectory(),
    () => false,
  );
  if (signedIn) {
    await cp(config.profileDir, profile, { recursive: true });
  } else {
    await mkdir(profile, { recursive: true });
  }
  return profile;
}

/** Waits in the lobby until the host admits the bot. Returns false when refused or timed out. */
async function admitted(page: Page, dispatchId: string): Promise<boolean> {
  let reported = false;
  const deadline = Date.now() + ADMIT_MS;
  while (Date.now() < deadline) {
    const state = await callState(page);
    if (state === 'IN_CALL') {
      return true;
    }
    if (state === 'DENIED' || state === 'ENDED') {
      return false;
    }
    if (state === 'WAITING' && !reported) {
      reported = true;
      await report(dispatchId, 'WAITING_ADMIT');
    }
    await wait(3000);
  }
  return false;
}

async function startMeeting(session: Session, trip: Assignment, page: Page): Promise<string> {
  const title = trip.title || (await page.title()).replace(/^Meet\s*-\s*/i, '') || trip.meetingCode;
  const { maStartSession } = await session.graphql<{ maStartSession: { id: string } }>(START, {
    input: {
      meetingCode: trip.meetingCode,
      url: trip.meetUrl,
      title,
      timezone: trip.timezone,
      startedAt: new Date().toISOString(),
    },
  });
  await session.graphql(CONSENT, { meetingId: maStartSession.id });
  return maStartSession.id;
}

/** Sends the recording to the portal as the extension would: audio chunks and screen pieces. */
function record(
  session: Session,
  trip: Assignment,
  meetingId: string,
  stage: Stage,
  dir: string,
): { recorder: Recorder; queue: UploadQueue } {
  const queue = new UploadQueue();
  let pieceSeq = 0;
  let audioSeq = 0;
  const recorder = startRecorder(stage, dir, trip.saveRecordings, {
    onPiece(bytes, durationMs) {
      const query = `?part=0&durationMs=${Math.min(durationMs, 60_000)}`;
      const at = `/video/${meetingId}/${pieceSeq}${query}`;
      pieceSeq += 1;
      queue.add(`Screen piece ${at}`, () => session.post(at, new Uint8Array(bytes), VIDEO_MIME));
    },
    onAudio(file, startMs, durationMs) {
      const seq = audioSeq;
      audioSeq += 1;
      queue.add(`Audio chunk ${seq}`, async () => {
        const audio = (await readFile(file)).toString('base64');
        const body = {
          meetingId,
          stream: 'TAB',
          seq,
          startMs,
          durationMs,
          mimeType: 'audio/webm',
          audio,
        };
        await session.post('/audio', JSON.stringify(body), 'application/json');
        await rm(file, { force: true });
      });
    },
  });
  return { recorder, queue };
}

/** Stays in the call until it ends, the bot is alone, time runs out or the trip is called off. */
async function stayInCall(page: Page, session: Session, trip: Assignment, meetingId: string) {
  const ends = Date.now() + trip.maxMeetingMinutes * 60_000;
  let aloneSince: number | null = null;
  while (Date.now() < ends) {
    await wait(CHECK_MS);
    if ((await callState(page)) !== 'IN_CALL') {
      return;
    }
    const others = await othersInCall(page);
    aloneSince = others > 0 ? null : (aloneSince ?? Date.now());
    if (aloneSince !== null && Date.now() - aloneSince > ALONE_MS) {
      return;
    }
    await session.graphql(BEAT, {
      meetingId,
      input: {
        transcriptionState: 'UNKNOWN',
        captureState: 'RECORDING',
        participantCount: others + 1,
      },
    });
    if ((await report(trip.dispatchId, 'IN_CALL', { meetingId })).leave) {
      return;
    }
  }
}

/** One trip, start to finish. Never throws: a failure is reported to the portal instead. */
export async function runTrip(trip: Assignment, slot: number): Promise<void> {
  const dir = path.join(config.workDir, trip.dispatchId);
  await mkdir(dir, { recursive: true });
  const session = new Session(trip.accessToken, trip.refreshToken);
  const stage = await openStage(slot);
  let context: BrowserContext | null = null;
  let meetingId: string | null = null;
  let recording: ReturnType<typeof record> | null = null;
  try {
    context = await openBrowser(stage, await tripProfile(dir));
    const page = context.pages()[0] ?? (await context.newPage());
    await askToJoin(page, trip.meetUrl, trip.botName);
    if (!(await admitted(page, trip.dispatchId))) {
      await report(trip.dispatchId, 'FAILED', { error: 'The bot was not let into the call.' });
      return;
    }
    meetingId = await startMeeting(session, trip, page);
    await postInChat(page, trip.consentMessage);
    await report(trip.dispatchId, 'IN_CALL', { meetingId });
    recording = record(session, trip, meetingId, stage, dir);
    await stayInCall(page, session, trip, meetingId);
    await leave(page);
    await recording.recorder.stop();
    await recording.queue.drained();
    await session.graphql(FINALIZE, { meetingId, endedAt: new Date().toISOString() });
    await report(trip.dispatchId, 'DONE', { meetingId });
    log('info', 'Meeting bot trip done', { dispatchId: trip.dispatchId, meetingId });
  } catch (error) {
    log('error', 'Meeting bot trip failed', { dispatchId: trip.dispatchId, err: errorText(error) });
    await report(trip.dispatchId, 'FAILED', {
      meetingId,
      error: errorText(error).slice(0, 300),
    }).catch(() => undefined);
  } finally {
    // After a failure mid-call: keep what was recorded; the portal ends the silent session.
    await recording?.recorder.stop();
    await recording?.queue.drained();
    await context?.close().catch(() => undefined);
    await stage.close();
    await session.revoke().catch(() => undefined);
    await rm(dir, { recursive: true, force: true });
  }
}
