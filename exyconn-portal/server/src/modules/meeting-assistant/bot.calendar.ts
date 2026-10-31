import { logger } from '../../utils/logger';
import { UserModel } from '../admin/user.model';
import { createDispatch } from './bot.service';
import { toMeetEvent, type MeetCalendarEvent } from './calendar.events';
import { calendarEvents } from './google-calendar.client';
import { accessTokenFor } from './google-meet.client';
import { GOOGLE_CALENDAR_SCOPE, googleMeetConfigured } from './google-meet.connect';
import { MaGoogleConnectionModel } from './models';
import { getMaSettings } from './settings.service';

/** How far ahead each scan looks; scans run more often than this, so nothing falls between. */
const LOOKAHEAD_MS = 15 * 60_000;
/** The bot asks to join this long before the event starts. */
const EARLY_MS = 60_000;
/** An event that started this long ago is still joined (the scan may have just missed it). */
const LATE_MS = 5 * 60_000;

/** Whether the person is expected in the event: not declined, timed (not all-day), not over. */
function joinable(event: MeetCalendarEvent, now: number): boolean {
  const self = event.attendees.find((attendee) => attendee.self);
  const starts = event.startsAt.getTime();
  return (
    !event.allDay &&
    self?.responseStatus !== 'declined' &&
    starts >= now - LATE_MS &&
    starts <= now + LOOKAHEAD_MS
  );
}

/** Queues the bot for one person's upcoming Meet events. Returns how many trips were added. */
async function queueFor(
  connection: { userId: string; refreshToken: string },
  now: number,
): Promise<number> {
  const owner = await UserModel.findById(connection.userId).select('name isActive').lean();
  if (!owner?.isActive) {
    return 0;
  }
  const token = await accessTokenFor(connection.refreshToken);
  const events = (
    await calendarEvents(token, new Date(now - LATE_MS), new Date(now + LOOKAHEAD_MS))
  )
    .flatMap((event) => toMeetEvent(event) ?? [])
    .filter((event) => joinable(event, now));
  let queued = 0;
  for (const event of events) {
    try {
      await createDispatch({
        ownerId: connection.userId,
        ownerName: owner.name,
        meetingCode: event.meetingCode,
        title: event.title,
        source: 'CALENDAR',
        calendarEventId: event.id,
        joinAt: new Date(event.startsAt.getTime() - EARLY_MS),
      });
      queued += 1;
    } catch {
      // Already queued for this event (or this call): one trip is enough.
    }
  }
  return queued;
}

/**
 * The calendar scan for the company in scope: when auto-join is on, every connected person's
 * Meet events starting soon get a bot. One person's broken connection never stops the rest.
 */
export async function scheduleCalendarBots(now = Date.now()): Promise<number> {
  const settings = await getMaSettings();
  if (!settings.enabled || !settings.botEnabled || !settings.botAutoJoin) {
    return 0;
  }
  if (!(await googleMeetConfigured())) {
    return 0;
  }
  const allowed = new Set(settings.allowedUserIds);
  const connections = await MaGoogleConnectionModel.find({ scopes: GOOGLE_CALENDAR_SCOPE })
    .select('userId refreshToken')
    .lean();
  let queued = 0;
  for (const connection of connections) {
    if (allowed.size > 0 && !allowed.has(connection.userId)) {
      continue;
    }
    try {
      queued += await queueFor(connection, now);
    } catch (error) {
      logger.warn({ err: error, userId: connection.userId }, 'Meeting bot calendar scan failed');
    }
  }
  return queued;
}
