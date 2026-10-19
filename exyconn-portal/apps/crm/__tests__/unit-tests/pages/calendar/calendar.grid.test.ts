import { describe, expect, it } from 'vitest';
import { ActivitySubject, CrmCalendarKind } from '@exyconn/shell/graphql/generated';
import {
  dayKey,
  itemsByDay,
  queryRange,
  readCalendar,
  shiftAnchor,
  viewDays,
} from '../../../../src/pages/calendar/calendar.grid';
import { itemLink } from '../../../../src/pages/calendar/calendar.kinds';
import { calendarItem } from './calendar.fixtures';

const NOW = new Date(2026, 9, 19, 15);

describe('the calendar grid', () => {
  it('reads the view and day from the address, falling back to this month', () => {
    expect(readCalendar(new URLSearchParams('view=week&date=2026-10-05'), NOW)).toEqual({
      view: 'week',
      anchor: new Date(2026, 9, 5),
    });
    const fallback = readCalendar(new URLSearchParams('view=year&date=nope'), NOW);
    expect(fallback.view).toBe('month');
    expect(dayKey(fallback.anchor)).toBe('2026-10-19');
  });

  it('draws whole weeks for a month, seven days for a week and one for a day', () => {
    const month = viewDays('month', NOW);
    expect(month.length % 7).toBe(0);
    expect(dayKey(month[0])).toBe('2026-09-27');
    expect(viewDays('week', NOW).map(dayKey)).toEqual([
      '2026-10-18',
      '2026-10-19',
      '2026-10-20',
      '2026-10-21',
      '2026-10-22',
      '2026-10-23',
      '2026-10-24',
    ]);
    expect(viewDays('day', NOW).map(dayKey)).toEqual(['2026-10-19']);
  });

  it('asks the server for a day either side of what it draws', () => {
    const { from, to } = queryRange(viewDays('day', NOW));
    expect(dayKey(from)).toBe('2026-10-18');
    expect(dayKey(to)).toBe('2026-10-21');
  });

  it('steps by a month, a week or a day', () => {
    expect(dayKey(shiftAnchor('month', NOW, 1))).toBe('2026-11-19');
    expect(dayKey(shiftAnchor('week', NOW, -1))).toBe('2026-10-12');
    expect(dayKey(shiftAnchor('day', NOW, 1))).toBe('2026-10-20');
  });

  it('puts each item on its day in the company zone, earliest first', () => {
    const late = calendarItem({ id: 'late', startAt: '2026-10-19T20:00:00.000Z' });
    const early = calendarItem({ id: 'early', startAt: '2026-10-19T08:00:00.000Z' });

    const byDay = itemsByDay([late, early], 'Asia/Kolkata');

    // 20:00 UTC is already 20 October in Kolkata.
    expect(byDay.get('2026-10-19')?.map((item) => item.id)).toEqual(['early']);
    expect(byDay.get('2026-10-20')?.map((item) => item.id)).toEqual(['late']);
  });
});

describe('where an entry opens', () => {
  it('opens the contact or company it is about, else the list it lives in', () => {
    expect(itemLink(calendarItem())).toBe('/contacts/c1');
    expect(itemLink(calendarItem({ relatedType: ActivitySubject.Company, relatedId: 'k1' }))).toBe(
      '/companies/k1',
    );
    expect(
      itemLink(calendarItem({ kind: CrmCalendarKind.Booking, relatedType: null, relatedId: '' })),
    ).toBe('/meetings/bookings');
    expect(itemLink(calendarItem({ relatedType: ActivitySubject.Deal, relatedId: 'd1' }))).toBe(
      '/deals',
    );
    expect(itemLink(calendarItem({ relatedType: null, relatedId: '' }))).toBe('/activities');
  });
});
