import mongoose from 'mongoose';
import { forEachOrganization } from '../organizations';
import { logger } from '../../utils/logger';
import { JOB_KEYS, recordJobRun } from '../../utils/jobHeartbeat';
import { registerBackgroundJob } from '../tech/jobs.registry';
import { MaChunkModel, MaEventModel, MaSegmentModel } from './models';
import { recoverStaleSessions } from './meeting.lifecycle';
import { requeueAbandonedJobs, runNextMaJob } from './jobs.runner';
import { deleteRecordings } from './recording.store';
import { getMaSettings } from './settings.service';

/** How often the pipeline looks for due steps and silent sessions. */
const TICK_MS = 15_000;
/** Steps one company may run per tick, so one busy company cannot starve the rest. */
const STEPS_PER_TICK = 3;
const RETENTION_MS = 60 * 60_000;
const DAY_MS = 86_400_000;

/**
 * Runs due steps one after another — never side by side, so one company never fans a shared
 * OpenAI key out — until none is due or `left` have run. Returns how many ran.
 */
async function drain(left: number): Promise<number> {
  if (left === 0 || !(await runNextMaJob())) {
    return 0;
  }
  return 1 + (await drain(left - 1));
}

/** One pass for the company in scope: requeue, recover, then run what is due. */
export async function runPipelinePass(): Promise<number> {
  await requeueAbandonedJobs();
  await recoverStaleSessions();
  return drain(STEPS_PER_TICK);
}

/**
 * Deletes what the company's retention settings say has expired: transcripts, the log and
 * chunk receipts after the transcript window; saved audio after the recording window.
 * Zero days keeps them until the meeting itself is deleted.
 */
export async function runRetentionPass(now = new Date()): Promise<number> {
  const settings = await getMaSettings();
  let removed = 0;
  if (settings.transcriptRetentionDays > 0) {
    const before = new Date(now.getTime() - settings.transcriptRetentionDays * DAY_MS);
    removed += (await MaSegmentModel.deleteMany({ createdAt: { $lt: before } })).deletedCount;
    removed += (await MaEventModel.deleteMany({ createdAt: { $lt: before } })).deletedCount;
    removed += (await MaChunkModel.deleteMany({ createdAt: { $lt: before } })).deletedCount;
  }
  if (settings.audioRetentionDays > 0) {
    removed += await deleteRecordings({
      before: new Date(now.getTime() - settings.audioRetentionDays * DAY_MS),
    });
  }
  return removed;
}

/** GridFS is not a Mongoose model, so its company-scoped lookup index is made here. */
async function ensureRecordingIndex(): Promise<void> {
  await mongoose.connection.db?.collection('ma_recordings.files').createIndex({
    'metadata.organizationId': 1,
    'metadata.meetingId': 1,
    'metadata.stream': 1,
    'metadata.seq': 1,
  });
}

/** Starts the after-meeting pipeline and the retention sweep. Nothing escapes a tick. */
export function startMeetingAssistantWorker(): void {
  ensureRecordingIndex().catch((error: unknown) => logger.error(error, 'Recording index failed'));
  const tick = () => {
    let ran = 0;
    forEachOrganization(async () => {
      ran += await runPipelinePass();
    }, 'Meeting assistant')
      .then(() =>
        recordJobRun(JOB_KEYS.meetingAssistant, ran > 0 ? `Ran ${ran} step(s)` : 'Nothing due'),
      )
      .catch((error: unknown) => logger.error(error, 'Meeting assistant tick failed'));
  };
  const sweep = () => {
    let removed = 0;
    forEachOrganization(async () => {
      removed += await runRetentionPass();
    }, 'Meeting assistant retention')
      .then(() =>
        recordJobRun(JOB_KEYS.meetingAssistantRetention, `Removed ${removed} expired record(s)`),
      )
      .catch((error: unknown) => logger.error(error, 'Meeting assistant retention failed'));
  };
  tick();
  sweep();
  globalThis.setInterval(tick, TICK_MS).unref();
  globalThis.setInterval(sweep, RETENTION_MS).unref();
  logger.info('Meeting assistant worker started');
}

registerBackgroundJob({
  key: JOB_KEYS.meetingAssistant,
  label: 'Meeting assistant pipeline',
  description:
    'Imports official Meet transcripts, writes AI notes and sends summary emails after calls.',
  runOnce: () => runPipelinePass(),
});

registerBackgroundJob({
  key: JOB_KEYS.meetingAssistantRetention,
  label: 'Meeting assistant retention',
  description: 'Deletes meeting transcripts, logs and saved audio past their retention windows.',
  runOnce: () => runRetentionPass(),
});
