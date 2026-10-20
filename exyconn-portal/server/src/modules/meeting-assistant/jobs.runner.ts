import { logger } from '../../utils/logger';
import { recordSystemAudit } from '../audit';
import {
  MaJobModel,
  MaMeetingModel,
  MaParticipantModel,
  type MaJobDocument,
  type MaMeetingDocument,
} from './models';
import { analyseMeeting } from './analysis.service';
import { saveActionItems, saveDecisions, saveNotes } from './analysis.persist';
import { sendSummary } from './ma.email';
import { importOfficialRecord, OfficialNotReady } from './google-meet.import';
import { enqueueMaJob } from './jobs.queue';
import { getMaSettings, withinMonthlyBudget } from './settings.service';
import { MA_AUDIT_MODULE, type MaSummaryStyle } from './ma.enums';

/** How long a step waits before trying again after a failure (doubling per attempt). */
const RETRY_BASE_MS = 60_000;
/** Google's transcript can take a while: the import is retried on this cadence. */
const IMPORT_RETRY_MS = 10 * 60_000;

type LeanMeeting = MaMeetingDocument & { _id: unknown };
type Job = MaJobDocument & { _id: unknown };

/** After notes exist: email them now, wait for approval, or do nothing, per the settings. */
async function afterNotes(meeting: LeanMeeting, version: number): Promise<void> {
  const settings = await getMaSettings();
  if (!settings.autoEmail) {
    return;
  }
  if (settings.emailRequiresApproval) {
    await MaMeetingModel.updateOne(
      { _id: meeting._id },
      { $set: { emailStatus: 'AWAITING_APPROVAL' } },
    );
    return;
  }
  await enqueueMaJob('EMAIL', String(meeting._id), { round: version });
  await MaMeetingModel.updateOne({ _id: meeting._id }, { $set: { emailStatus: 'QUEUED' } });
}

/** Writes the notes, decisions and checklist from one analysis run. */
async function runAnalyze(meeting: LeanMeeting, job: Job): Promise<void> {
  const settings = await getMaSettings();
  if (!(await withinMonthlyBudget(settings))) {
    throw new Error('The monthly AI budget for meetings is spent.');
  }
  await MaMeetingModel.updateOne(
    { _id: meeting._id },
    { $set: { summaryStatus: 'RUNNING', summaryError: '' } },
  );
  const style = (job.style ?? settings.summaryStyle) as MaSummaryStyle;
  const run = await analyseMeeting(meeting, style, settings.analysisModel);
  const notes = await saveNotes(meeting, run, style);
  await saveDecisions(meeting, run);
  const people = await MaParticipantModel.find({ meetingId: String(meeting._id) }).distinct(
    'displayName',
  );
  const actions = await saveActionItems(meeting, run, people);
  await MaMeetingModel.updateOne(
    { _id: meeting._id },
    { $set: { summaryStatus: 'READY' }, $inc: { costUsd: run.costUsd } },
  );
  await recordSystemAudit({
    action: 'CREATE',
    module: MA_AUDIT_MODULE,
    entityId: meeting._id,
    entityLabel: meeting.title,
    summary: `Generated meeting notes (version ${notes.version}) with ${actions} action item(s)`,
  });
  await afterNotes(meeting, notes.version);
}

/** Imports Google's record, then hands over to the notes step. */
async function runImport(meeting: LeanMeeting): Promise<void> {
  await MaMeetingModel.updateOne(
    { _id: meeting._id },
    { $set: { officialImportStatus: 'RUNNING' } },
  );
  await importOfficialRecord(meeting);
  await MaMeetingModel.updateOne({ _id: meeting._id }, { $set: { officialImportStatus: 'READY' } });
  await queueNotesAfterImport(meeting);
}

/** The import is over (well or not): notes follow when there is anything to summarise. */
async function queueNotesAfterImport(meeting: LeanMeeting): Promise<void> {
  const settings = await getMaSettings();
  const fresh = await MaMeetingModel.findById(meeting._id).select('segmentCount').lean();
  if (!settings.autoGenerateSummary) {
    return;
  }
  if (!fresh || fresh.segmentCount === 0) {
    await MaMeetingModel.updateOne({ _id: meeting._id }, { $set: { summaryStatus: 'SKIPPED' } });
    return;
  }
  await enqueueMaJob('ANALYZE', String(meeting._id));
  await MaMeetingModel.updateOne({ _id: meeting._id }, { $set: { summaryStatus: 'QUEUED' } });
}

async function runStep(job: Job, meeting: LeanMeeting): Promise<void> {
  if (job.kind === 'IMPORT_OFFICIAL') {
    await runImport(meeting);
  } else if (job.kind === 'ANALYZE') {
    await runAnalyze(meeting, job);
  } else {
    const failed = await sendSummary(meeting, job.requestedByName || 'Meeting Assistant');
    if (failed > 0) {
      throw new Error(`${failed} summary email(s) failed`);
    }
  }
}

/** Records what a final failure means on the meeting itself, so the portal can show it. */
async function markGivenUp(job: Job, meeting: LeanMeeting, message: string): Promise<void> {
  if (job.kind === 'IMPORT_OFFICIAL') {
    await MaMeetingModel.updateOne(
      { _id: meeting._id },
      { $set: { officialImportStatus: 'FAILED' } },
    );
    // Our own transcript can still be summarised without Google's.
    await queueNotesAfterImport(meeting);
  } else if (job.kind === 'ANALYZE') {
    await MaMeetingModel.updateOne(
      { _id: meeting._id },
      { $set: { summaryStatus: 'FAILED', summaryError: message } },
    );
  }
}

async function failJob(job: Job, meeting: LeanMeeting, error: unknown): Promise<void> {
  const message = error instanceof Error ? error.message.slice(0, 300) : 'Step failed';
  const waiting = error instanceof OfficialNotReady;
  const exhausted = job.attempts >= job.maxAttempts;
  const delay = waiting ? IMPORT_RETRY_MS : RETRY_BASE_MS * 2 ** (job.attempts - 1);
  await MaJobModel.updateOne(
    { _id: job._id },
    {
      $set: {
        status: exhausted ? 'FAILED' : 'QUEUED',
        lastError: message,
        runAfter: new Date(Date.now() + delay),
      },
    },
  );
  if (exhausted) {
    await markGivenUp(job, meeting, message);
  }
  logger.warn(
    { jobId: String(job._id), kind: job.kind, attempt: job.attempts, err: message },
    'Meeting assistant step failed',
  );
}

/**
 * Claims and runs the oldest due step, if any. The claim and the read are one atomic
 * findOneAndUpdate, so two ticks never take the same step. Reports whether it ran one.
 */
export async function runNextMaJob(now = new Date()): Promise<boolean> {
  const job = await MaJobModel.findOneAndUpdate(
    { status: 'QUEUED', runAfter: { $lte: now } },
    { $set: { status: 'RUNNING' }, $inc: { attempts: 1 } },
    { sort: { runAfter: 1 }, new: true },
  ).lean<Job>();
  if (!job) {
    return false;
  }
  const meeting = await MaMeetingModel.findById(job.meetingId).lean<LeanMeeting>();
  if (!meeting) {
    await MaJobModel.updateOne(
      { _id: job._id },
      { $set: { status: 'FAILED', lastError: 'Meeting deleted' } },
    );
    return true;
  }
  try {
    await runStep(job, meeting);
    await MaJobModel.updateOne({ _id: job._id }, { $set: { status: 'DONE', lastError: '' } });
  } catch (error) {
    await failJob(job, meeting, error);
  }
  return true;
}

/** Steps left RUNNING by a process that died mid-step go back on the queue. */
export async function requeueAbandonedJobs(now = new Date()): Promise<number> {
  const result = await MaJobModel.updateMany(
    { status: 'RUNNING', updatedAt: { $lt: new Date(now.getTime() - 15 * 60_000) } },
    { $set: { status: 'QUEUED', runAfter: now } },
  );
  return result.modifiedCount;
}
