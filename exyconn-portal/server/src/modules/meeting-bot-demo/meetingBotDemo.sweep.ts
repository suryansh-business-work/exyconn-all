import { env } from '../../config/env';
import { runForOrganization } from '../../lib/tenant';
import { logger } from '../../utils/logger';
import { sendTemplateEmail } from '../email/email.service';
import { SUMMARY_TEMPLATE, summaryVariables } from '../meeting-assistant/ma.email';
import { deleteMeetingData } from '../meeting-assistant/meeting.delete';
import { MaBotDispatchModel, MaMeetingModel, MaNotesModel } from '../meeting-assistant/models';
import { MeetingBotDemoTripModel } from './meetingBotDemo.model';
import { meetingDemo } from './meetingBotDemo.org';

const TICK_MS = 5 * 60_000;
/** A trip whose notes never arrive stops being checked after this long. */
const NOTES_WAIT_MS = 2 * 24 * 60 * 60 * 1000;

type Trip = { _id: unknown; dispatchId: string; callerEmail: string; meetingCode: string };

/** The meeting a trip recorded, once its notes are written; null until then. */
async function meetingWithNotes(trip: Trip) {
  const dispatch = await MaBotDispatchModel.findById(trip.dispatchId).select('meetingId').lean();
  const meetingId = dispatch?.meetingId;
  if (!meetingId || !(await MaNotesModel.exists({ meetingId }))) {
    return null;
  }
  return MaMeetingModel.findById(meetingId).lean();
}

/**
 * Emails one visitor their notes, exactly once: the trip is claimed before the send, and a
 * failed send is recorded on it rather than retried into a second copy.
 */
async function emailNotes(trip: Trip): Promise<void> {
  const meeting = await meetingWithNotes(trip);
  if (!meeting) {
    return;
  }
  const claimed = await MeetingBotDemoTripModel.findOneAndUpdate(
    { _id: trip._id, emailedAt: null },
    { $set: { emailedAt: new Date() } },
  );
  if (!claimed) {
    return;
  }
  try {
    const { variables } = await summaryVariables(meeting, env.demos.meetingBot.pageUrl);
    await sendTemplateEmail({
      template: SUMMARY_TEMPLATE,
      to: trip.callerEmail,
      variables,
      triggeredBy: 'Meeting bot demo',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 300) : 'Send failed';
    await MeetingBotDemoTripModel.updateOne({ _id: trip._id }, { $set: { emailError: message } });
    logger.warn({ tripId: String(trip._id), err: message }, 'Meeting bot demo email failed');
  }
}

/** Deletes every recorded meeting whose demo retention is over. Returns how many trips. */
async function purgeExpired(now: Date): Promise<number> {
  const due = await MeetingBotDemoTripModel.find({ purgedAt: null, purgeAfter: { $lte: now } })
    .select('dispatchId')
    .lean();
  for (const trip of due) {
    const dispatch = await MaBotDispatchModel.findById(trip.dispatchId).select('meetingId').lean();
    if (dispatch?.meetingId) {
      await deleteMeetingData(dispatch.meetingId);
    }
    await MeetingBotDemoTripModel.updateOne({ _id: trip._id }, { $set: { purgedAt: now } });
  }
  return due.length;
}

/** One pass in the demo company: notes emailed to whoever is due them, expired meetings deleted. */
export async function runMeetingBotDemoSweep(now = new Date()): Promise<void> {
  const demo = await meetingDemo();
  await runForOrganization(demo.organizationId, async () => {
    const waiting = await MeetingBotDemoTripModel.find({
      emailedAt: null,
      purgedAt: null,
      createdAt: { $gte: new Date(now.getTime() - NOTES_WAIT_MS) },
    }).lean();
    for (const trip of waiting) {
      await emailNotes(trip);
    }
    const purged = await purgeExpired(now);
    if (purged > 0) {
      logger.info(`Meeting bot demo deleted ${purged} expired demo meeting(s)`);
    }
  });
}

/** Starts the demo's loop: notes out as soon as they are written, recordings gone on time. */
export function startMeetingBotDemoSweep(): void {
  const tick = () => {
    runMeetingBotDemoSweep().catch((error: unknown) =>
      logger.error({ err: error }, 'Meeting bot demo sweep failed'),
    );
  };
  globalThis.setInterval(tick, TICK_MS).unref();
  logger.info('Meeting bot demo sweep started');
}
