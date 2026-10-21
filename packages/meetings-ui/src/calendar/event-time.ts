import { formatDate, formatDateTime, formatTime, type FormatSettings } from '@exyconn/i18n';
import type { CalendarEvent } from './calendar-entries';

/** When an event runs, in the viewer's zone and patterns: one day, or one day to another. */
export function eventWhen(
  event: CalendarEvent,
  settings: FormatSettings,
): { from: string; to: string } {
  if (event.allDay) {
    const utc = { ...settings, timezone: 'UTC' };
    // Google ends an all-day event at the start of the day after its last one.
    const last = new Date(new Date(event.endsAt).getTime() - 1);
    return { from: formatDate(event.startsAt, utc), to: formatDate(last, utc) };
  }
  const sameDay = formatDate(event.startsAt, settings) === formatDate(event.endsAt, settings);
  return {
    from: formatDateTime(event.startsAt, settings),
    to: sameDay ? formatTime(event.endsAt, settings) : formatDateTime(event.endsAt, settings),
  };
}

const RESPONSES: Readonly<Record<string, string>> = {
  accepted: 'Accepted',
  declined: 'Declined',
  tentative: 'Maybe',
};

/** Google's answer for an attendee, as the person reads it. */
export const responseLabel = (status: string): string => RESPONSES[status] ?? 'No reply';
