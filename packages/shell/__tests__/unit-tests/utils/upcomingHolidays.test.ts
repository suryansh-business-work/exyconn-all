import { describe, expect, it } from 'vitest';
import { upcomingHolidays } from '@/utils/upcomingHolidays';
import { formatWith, toDate } from '@/utils/date';

const holiday = (id: string, date: string) => ({ id, name: `Holiday ${id}`, date });
const today = new Date('2026-03-10T12:00:00.000Z');

describe('upcomingHolidays', () => {
  it('keeps only the holidays after today, soonest first, three by default', () => {
    const list = [
      holiday('d', '2026-06-01'),
      holiday('past', '2026-01-26'),
      holiday('b', '2026-04-14'),
      holiday('a', '2026-03-25'),
      holiday('c', '2026-05-01'),
    ];

    expect(upcomingHolidays(list, today).map((h) => h.id)).toEqual(['a', 'b', 'c']);
  });

  it('honours a custom limit and leaves the caller array untouched', () => {
    const list = [holiday('b', '2026-04-14'), holiday('a', '2026-03-25')];

    expect(upcomingHolidays(list, today, 1).map((h) => h.id)).toEqual(['a']);
    expect(list.map((h) => h.id)).toEqual(['b', 'a']);
  });

  it('skips holidays whose date does not parse, and returns nothing when none are ahead', () => {
    expect(upcomingHolidays([holiday('x', 'soon'), holiday('y', '')], today)).toEqual([]);
    expect(upcomingHolidays([holiday('p', '2025-12-25')], today)).toEqual([]);
  });
});

describe('toDate', () => {
  it('passes a valid Date through and rejects an invalid one', () => {
    const date = new Date('2026-01-15T00:00:00.000Z');
    expect(toDate(date)).toBe(date);
    expect(toDate(new Date('nope'))).toBeNull();
    expect(formatWith(date, 'yyyy')).toBe('2026');
  });
});
