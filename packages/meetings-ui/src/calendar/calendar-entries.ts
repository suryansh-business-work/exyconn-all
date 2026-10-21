import { formatDate, type FormatSettings } from '@exyconn/i18n';
import type { MaCalendarQuery } from '@exyconn/shell/graphql/generated';

export type CalendarData = MaCalendarQuery['maCalendar'];
export type CalendarMeeting = CalendarData['meetings'][number];
export type CalendarEvent = CalendarData['events'][number];

/** One thing on the calendar: a recorded meeting, or a Google event nothing recorded yet. */
export type CalendarEntry =
  | { kind: 'meeting'; id: string; title: string; startsAt: string; meeting: CalendarMeeting }
  | { kind: 'event'; id: string; title: string; startsAt: string; event: CalendarEvent };

export type EntryKind = CalendarEntry['kind'];

/**
 * Every meeting, and every Google event no meeting recorded: a call recorded by the assistant
 * shows once, as its meeting, which opens the meeting's own page.
 */
export function calendarEntries(data: CalendarData, untitled: string): CalendarEntry[] {
  const meetings: CalendarEntry[] = data.meetings.map((meeting) => ({
    kind: 'meeting',
    id: `meeting:${meeting.id}`,
    title: meeting.title || untitled,
    startsAt: meeting.startedAt,
    meeting,
  }));
  const events: CalendarEntry[] = data.events
    .filter((event) => !event.meetingId)
    .map((event) => ({
      kind: 'event',
      id: `event:${event.id}`,
      title: event.title || untitled,
      startsAt: event.startsAt,
      event,
    }));
  return [...meetings, ...events].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

/** The viewer's calendar day an entry falls on; an all-day event keeps its own date. */
export function entryDay(entry: CalendarEntry, settings: FormatSettings): string {
  if (entry.kind === 'event' && entry.event.allDay) {
    return entry.startsAt.slice(0, 10);
  }
  return formatDate(entry.startsAt, { ...settings, dateFormat: 'yyyy-MM-dd' });
}

/** Entries by the viewer's day, each day earliest first. */
export function entriesByDay(
  entries: readonly CalendarEntry[],
  settings: FormatSettings,
): Map<string, CalendarEntry[]> {
  const byDay = new Map<string, CalendarEntry[]>();
  for (const entry of entries) {
    const key = entryDay(entry, settings);
    byDay.set(key, [...(byDay.get(key) ?? []), entry]);
  }
  return byDay;
}

/** Today in the viewer's own zone. */
export const todayKey = (settings: FormatSettings, now = new Date()): string =>
  formatDate(now, { ...settings, dateFormat: 'yyyy-MM-dd' });

/** A calendar day (`yyyy-MM-dd`) in the company's date pattern; read in UTC, noon is that day. */
export const formatDay = (key: string, settings: FormatSettings): string =>
  formatDate(`${key}T12:00:00Z`, { ...settings, timezone: 'UTC' });
