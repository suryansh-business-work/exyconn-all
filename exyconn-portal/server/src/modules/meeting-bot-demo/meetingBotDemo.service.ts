import { isValidObjectId } from 'mongoose';
import { env } from '../../config/env';
import type { DemoCaller } from '../../lib/demoCaller';
import { runForOrganization } from '../../lib/tenant';
import { badRequest, notFound } from '../../utils/errors';
import { recordAudit } from '../audit';
import { createDispatch, meetCodeOfUrl } from '../meeting-assistant/bot.service';
import { MaBotDispatchModel } from '../meeting-assistant/models';
import { getMaSettings } from '../meeting-assistant/settings.service';
import { MeetingBotDemoTripModel } from './meetingBotDemo.model';
import { meetingDemo } from './meetingBotDemo.org';
import { presentTrip } from './meetingBotDemo.present';

const DAY_MS = 24 * 60 * 60 * 1000;
/** How many of a visitor's trips the page lists. */
const LISTED_TRIPS = 20;
const AUDIT_MODULE = 'Meeting bot demo';

/** The recording terms a visitor agrees to before the bot is sent, stored with each trip. */
export function consentTextOf(botName: string): string {
  const { retentionDays, maxMeetingMinutes } = env.demos.meetingBot;
  return (
    `I invite ${botName} into this Google Meet call. It announces itself in the call's chat, ` +
    `records and transcribes up to ${maxMeetingMinutes} minutes, and writes notes and action ` +
    `items that are emailed to me. I will tell everyone in the call that it is being recorded. ` +
    `The recording, transcript and notes are deleted after ${retentionDays} days.`
  );
}

/** Runs inside the demo company. */
async function inDemo<T>(work: () => Promise<T>): Promise<T> {
  const demo = await meetingDemo();
  return runForOrganization(demo.organizationId, work);
}

/** The visitor's trips in the last 24 hours, which the daily limit counts. */
const tripsToday = (caller: DemoCaller) =>
  MeetingBotDemoTripModel.countDocuments({
    callerKey: caller.key,
    createdAt: { $gte: new Date(Date.now() - DAY_MS) },
  });

/** Whether the bot service can pick work up at all: without its secret no bot ever comes. */
const botConfigured = () => env.meetAssistant.botToken.length > 0;

/** What the demo page shows before anything is sent: the limits, the terms, the bot's name. */
export function demoInfo(caller: DemoCaller) {
  return inDemo(async () => {
    const settings = await getMaSettings();
    const { tripsPerDay, retentionDays, maxMeetingMinutes } = env.demos.meetingBot;
    const used = await tripsToday(caller);
    return {
      enabled: botConfigured() && settings.enabled && settings.botEnabled,
      botName: settings.botName,
      tripsPerDay,
      tripsLeftToday: Math.max(0, tripsPerDay - used),
      retentionDays,
      maxMeetingMinutes,
      consentText: consentTextOf(settings.botName),
    };
  });
}

/** Sends the bot into the visitor's call, once they have agreed to the recording terms. */
export function sendDemoBot(
  caller: DemoCaller,
  input: { meetUrl: string; consent: boolean },
  ip: string,
) {
  if (!input.consent) {
    badRequest('Agree to the recording terms to send the bot.');
  }
  if (!botConfigured()) {
    badRequest('The meeting bot is not set up on this server yet.');
  }
  const meetingCode = meetCodeOfUrl(input.meetUrl);
  return inDemo(async () => {
    if ((await tripsToday(caller)) >= env.demos.meetingBot.tripsPerDay) {
      badRequest('You have used today’s demo calls. Try again tomorrow.');
    }
    const demo = await meetingDemo();
    const settings = await getMaSettings();
    const dispatch = await createDispatch({
      ownerId: demo.accountId,
      // The bot introduces itself in the call as joining for this name.
      ownerName: caller.name,
      meetingCode,
      title: caller.company ? `Demo call · ${caller.company}` : 'Demo call',
      source: 'MANUAL',
      calendarEventId: null,
      joinAt: new Date(),
    });
    const trip = await MeetingBotDemoTripModel.create({
      callerKey: caller.key,
      callerName: caller.name,
      callerEmail: caller.email,
      dispatchId: String(dispatch._id),
      meetingCode,
      consentText: consentTextOf(settings.botName),
      consentAt: new Date(),
      ip,
      purgeAfter: new Date(Date.now() + env.demos.meetingBot.retentionDays * DAY_MS),
    });
    await recordAudit(
      { user: null, ip },
      {
        action: 'CREATE',
        module: AUDIT_MODULE,
        entityId: trip._id,
        entityLabel: meetingCode,
        summary: `${caller.email} sent the demo meeting bot into ${meetingCode} and agreed to the recording terms`,
        actor: { id: caller.key, name: caller.name, email: caller.email },
      },
    );
    return presentTrip(trip.toObject());
  });
}

/** The visitor's own trips, newest first. */
export function demoTrips(caller: DemoCaller) {
  return inDemo(async () => {
    const trips = await MeetingBotDemoTripModel.find({ callerKey: caller.key })
      .sort({ createdAt: -1 })
      .limit(LISTED_TRIPS)
      .lean();
    return Promise.all(trips.map(presentTrip));
  });
}

/** One of the visitor's own trips; anybody else's is not found. */
async function ownTrip(caller: DemoCaller, id: string) {
  const trip = isValidObjectId(id)
    ? await MeetingBotDemoTripModel.findOne({ _id: id, callerKey: caller.key }).lean()
    : null;
  if (!trip) {
    notFound('Demo call');
  }
  return trip;
}

export function demoTrip(caller: DemoCaller, id: string) {
  return inDemo(async () => presentTrip(await ownTrip(caller, id)));
}

/** Calls the bot back from the visitor's call: a queued trip never starts, a running one leaves. */
export function cancelDemoTrip(caller: DemoCaller, id: string) {
  return inDemo(async () => {
    const trip = await ownTrip(caller, id);
    await MaBotDispatchModel.updateOne(
      { _id: trip.dispatchId, active: true },
      { $set: { status: 'CANCELLED', active: false, finishedAt: new Date() } },
    );
    return presentTrip(trip);
  });
}
