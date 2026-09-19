import { describe, expect, it } from 'vitest';
import { buildCalendar, monthRange, postTime } from '../../src/pages/social/calendar.days';

const month = new Date(2026, 8, 1); // September 2026
const local = (day: number, hour: number) => new Date(2026, 8, day, hour).toISOString();

describe('social calendar', () => {
  it('asks for whole weeks around the month', () => {
    const { from, to } = monthRange(month);
    expect(from.getDay()).toBe(0);
    expect((to.getTime() - from.getTime()) / 86_400_000).toBe(35);
  });

  it('places each post on its day, earliest first, published before scheduled time', () => {
    const days = buildCalendar(
      month,
      [
        { id: 'late', status: 'SCHEDULED', network: 'X', scheduledAt: local(10, 18) },
        {
          id: 'early',
          status: 'PUBLISHED',
          network: 'X',
          scheduledAt: local(11, 9),
          publishedAt: local(10, 9),
        },
        { id: 'draft', status: 'DRAFT', network: 'X' },
      ],
      new Date(2026, 8, 19),
    );
    expect(days.find((d) => d.key === '2026-09-10')?.posts.map((p) => p.id)).toEqual([
      'early',
      'late',
    ]);
    expect(days.filter((d) => d.isToday).map((d) => d.key)).toEqual(['2026-09-19']);
    expect(days.find((d) => d.key === '2026-08-30')?.inMonth).toBe(false);
    expect(postTime({ id: 'x', status: 'DRAFT', network: 'X' })).toBeNull();
  });
});
