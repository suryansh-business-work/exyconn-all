import { describe, expect, it } from 'vitest';
import { DEFAULT_FORMAT_SETTINGS } from '@exyconn/i18n';
import {
  calendarEntries,
  entriesByDay,
  formatDay,
  todayKey,
} from '../../../src/calendar/calendar-entries';
import { eventWhen, responseLabel } from '../../../src/calendar/event-time';
import { calendarData, calendarEvent, calendarMeeting } from './calendar-fixtures';

const UTC = { ...DEFAULT_FORMAT_SETTINGS, timezone: 'UTC' };
const KOLKATA = { ...DEFAULT_FORMAT_SETTINGS, timezone: 'Asia/Kolkata' };

describe('calendar entries', () => {
  it('shows each meeting and only the events no meeting recorded, earliest first', () => {
    const data = calendarData({
      meetings: [calendarMeeting({ title: '' })],
      events: [
        calendarEvent({ id: 'recorded', meetingId: 'm1' }),
        calendarEvent({ id: 'early', title: '', startsAt: '2026-10-01T08:00:00.000Z' }),
      ],
    }).maCalendar;

    const entries = calendarEntries(data, 'Untitled');

    expect(entries.map((entry) => [entry.id, entry.title])).toEqual([
      ['event:early', 'Untitled'],
      ['meeting:m1', 'Untitled'],
    ]);
  });

  it("files entries under the viewer's own day, and an all-day event under its date", () => {
    const late = calendarMeeting({ id: 'late', startedAt: '2026-10-14T20:00:00.000Z' });
    const allDay = calendarEvent({ allDay: true, startsAt: '2026-10-16T00:00:00.000Z' });
    const entries = calendarEntries(
      calendarData({ meetings: [late], events: [allDay] }).maCalendar,
      '',
    );

    expect([...entriesByDay(entries, UTC).keys()]).toEqual(['2026-10-14', '2026-10-16']);
    expect([...entriesByDay(entries, KOLKATA).keys()]).toEqual(['2026-10-15', '2026-10-16']);
  });

  it("names today and a calendar day in the viewer's zone and pattern", () => {
    const now = new Date('2026-10-20T20:00:00.000Z');
    expect(todayKey(UTC, now)).toBe('2026-10-20');
    expect(todayKey(KOLKATA, now)).toBe('2026-10-21');
    expect(formatDay('2026-10-21', KOLKATA)).toBe('21 Oct 2026');
  });

  it('gives a timed event its times and an all-day event its days', () => {
    expect(eventWhen(calendarEvent(), UTC)).toEqual({
      from: '15 Oct 2026 09:00 AM',
      to: '09:45 AM',
    });
    const overnight = calendarEvent({ endsAt: '2026-10-16T01:00:00.000Z' });
    expect(eventWhen(overnight, UTC).to).toBe('16 Oct 2026 01:00 AM');
    const days = calendarEvent({
      allDay: true,
      startsAt: '2026-10-15T00:00:00.000Z',
      endsAt: '2026-10-17T00:00:00.000Z',
    });
    expect(eventWhen(days, KOLKATA)).toEqual({ from: '15 Oct 2026', to: '16 Oct 2026' });
  });

  it("reads Google's answers for a guest", () => {
    expect(responseLabel('accepted')).toBe('Accepted');
    expect(responseLabel('declined')).toBe('Declined');
    expect(responseLabel('tentative')).toBe('Maybe');
    expect(responseLabel('needsAction')).toBe('No reply');
  });
});
