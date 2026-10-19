import { ActivityModel } from '../activity.model';
import { MeetingBookingModel } from '../meetings/meeting.models';
import { assertPermission } from '../../../lib/permissions';
import { ROLES } from '../../../constants/roles';
import { badRequest } from '../../../utils/errors';
import type { GraphQLContext } from '../../../middleware/auth';

/** The widest window one request may ask for: a month view with a week either side. */
const MAX_RANGE_DAYS = 62;
const DAY_MS = 24 * 60 * 60 * 1000;
/** A ceiling per source, so a busy team's calendar cannot pull a whole collection. */
const MAX_ROWS = 1000;

export type CrmCalendarKind = 'REMINDER' | 'TASK' | 'MEETING' | 'ACTIVITY' | 'BOOKING';

/** One thing on the calendar, from whichever record it lives on. */
export interface CrmCalendarItem {
  id: string;
  kind: CrmCalendarKind;
  title: string;
  startAt: Date;
  endAt: Date | null;
  done: boolean;
  relatedType: string | null;
  relatedId: string;
  relatedName: string;
  /** Who it belongs to: the assignee, the owner, or the meeting's host. */
  person: string;
}

interface ActivityRow {
  _id: unknown;
  type: string;
  subject: string;
  dueDate?: Date | null;
  remindAt?: Date | null;
  done: boolean;
  relatedType?: string;
  relatedId?: string;
  relatedName?: string;
  owner?: string;
  assigneeName?: string;
}

interface BookingRow {
  _id: unknown;
  meetingTitle: string;
  name: string;
  startAt: Date;
  endAt: Date;
  hostName: string;
  contactId?: string;
}

/** The checked window: a real, forward range no wider than {@link MAX_RANGE_DAYS}. */
export function calendarWindow(from: Date | string, to: Date | string): { from: Date; to: Date } {
  const start = new Date(from);
  const end = new Date(to);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    badRequest('Choose a calendar range that ends after it starts.');
  }
  if (end.getTime() - start.getTime() > MAX_RANGE_DAYS * DAY_MS) {
    badRequest(`A calendar range can cover at most ${MAX_RANGE_DAYS} days.`);
  }
  return { from: start, to: end };
}

/** How an activity shows: a reminder by its own colour, otherwise by what kind of work it is. */
function kindOf(row: ActivityRow): CrmCalendarKind {
  if (row.remindAt) {
    return 'REMINDER';
  }
  if (row.type === 'TASK' || row.type === 'MEETING') {
    return row.type;
  }
  return 'ACTIVITY';
}

export function activityItem(row: ActivityRow): CrmCalendarItem {
  return {
    id: String(row._id),
    kind: kindOf(row),
    title: row.subject,
    startAt: row.remindAt ?? (row.dueDate as Date),
    endAt: null,
    done: row.done,
    relatedType: row.relatedType ?? null,
    relatedId: row.relatedId ?? '',
    relatedName: row.relatedName ?? '',
    person: [row.assigneeName, row.owner].find(Boolean) ?? '',
  };
}

export function bookingItem(row: BookingRow): CrmCalendarItem {
  return {
    id: `booking:${String(row._id)}`,
    kind: 'BOOKING',
    title: `${row.meetingTitle} · ${row.name}`,
    startAt: row.startAt,
    endAt: row.endAt,
    done: false,
    relatedType: row.contactId ? 'CONTACT' : null,
    relatedId: row.contactId ?? '',
    relatedName: row.contactId ? row.name : '',
    person: row.hostName,
  };
}

/**
 * Everything dated in the window: reminders (at their reminder time), tasks and other
 * activities with a due date, and confirmed meeting bookings — one indexed range read per
 * source, merged and sorted by start.
 */
export async function crmCalendarItems(from: Date, to: Date): Promise<CrmCalendarItem[]> {
  const inWindow = { $gte: from, $lt: to };
  const [activities, bookings] = await Promise.all([
    ActivityModel.find({
      archivedAt: null,
      $or: [{ remindAt: inWindow }, { remindAt: null, dueDate: inWindow }],
    })
      .select(
        'type subject dueDate remindAt done relatedType relatedId relatedName owner assigneeName',
      )
      .sort({ dueDate: 1 })
      .limit(MAX_ROWS)
      .lean<ActivityRow[]>(),
    MeetingBookingModel.find({ status: 'CONFIRMED', startAt: inWindow })
      .select('meetingTitle name startAt endAt hostName contactId')
      .sort({ startAt: 1 })
      .limit(MAX_ROWS)
      .lean<BookingRow[]>(),
  ]);
  return [...activities.map(activityItem), ...bookings.map(bookingItem)].sort(
    (a, b) => a.startAt.getTime() - b.startAt.getTime(),
  );
}

export const crmCalendarResolvers = {
  Query: {
    crmCalendar: async (
      _p: unknown,
      { from, to }: { from: Date | string; to: Date | string },
      ctx: GraphQLContext,
    ) => {
      await assertPermission(ctx, 'Activity', [ROLES.CRM], 'VIEW');
      const window = calendarWindow(from, to);
      return crmCalendarItems(window.from, window.to);
    },
  },
};
