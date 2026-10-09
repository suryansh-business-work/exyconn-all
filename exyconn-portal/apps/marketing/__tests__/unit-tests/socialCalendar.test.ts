import { describe, expect, it } from 'vitest';
import {
  buildCalendar,
  dayKeyIn,
  defaultScheduleTime,
  monthRange,
  postTime,
  queryRange,
  wallClock,
} from '../../src/pages/social/calendar.days';

const month = new Date(2026, 8, 1); // September 2026
const UTC = 'UTC';
const KOLKATA = 'Asia/Kolkata'; // +05:30, never the zone the tests run in by accident
const LOS_ANGELES = 'America/Los_Angeles';

describe('social calendar', () => {
  it('asks for whole weeks around the month', () => {
    const { from, to } = monthRange(month);
    expect(from.getDay()).toBe(0);
    expect((to.getTime() - from.getTime()) / 86_400_000).toBe(35);
  });

  it('asks the server for a day either side of the grid', () => {
    const grid = monthRange(month);
    const { from, to } = queryRange(month);
    expect(grid.from.getTime() - from.getTime()).toBe(86_400_000);
    expect(to.getTime() - grid.to.getTime()).toBe(86_400_000);
  });

  it('places each post on its day, earliest first, published before scheduled time', () => {
    const days = buildCalendar(
      month,
      [
        { id: 'late', status: 'SCHEDULED', network: 'X', scheduledAt: '2026-09-10T18:00:00Z' },
        {
          id: 'early',
          status: 'PUBLISHED',
          network: 'X',
          scheduledAt: '2026-09-11T09:00:00Z',
          publishedAt: '2026-09-10T09:00:00Z',
        },
        { id: 'draft', status: 'DRAFT', network: 'X' },
      ],
      new Date('2026-09-19T12:00:00Z'),
      UTC,
    );
    expect(days.find((d) => d.key === '2026-09-10')?.posts.map((p) => p.id)).toEqual([
      'early',
      'late',
    ]);
    expect(days.filter((d) => d.isToday).map((d) => d.key)).toEqual(['2026-09-19']);
    expect(days.find((d) => d.key === '2026-08-30')?.inMonth).toBe(false);
    expect(days.find((d) => !d.isPast)?.key).toBe('2026-09-19');
    expect(days.find((d) => d.key === '2026-09-18')?.isPast).toBe(true);
    expect(postTime({ id: 'x', status: 'DRAFT', network: 'X' })).toBeNull();
  });

  it("uses the workspace's timezone for a post's day and for today", () => {
    // 20:00 UTC on the 10th is already the 11th in Kolkata.
    const late = {
      id: 'p',
      status: 'SCHEDULED',
      network: 'X',
      scheduledAt: '2026-09-10T20:00:00Z',
    };
    const now = new Date('2026-09-18T20:00:00Z');
    const inKolkata = buildCalendar(month, [late], now, KOLKATA);
    expect(inKolkata.find((d) => d.key === '2026-09-11')?.posts).toHaveLength(1);
    expect(inKolkata.find((d) => d.isToday)?.key).toBe('2026-09-19');
    expect(inKolkata.find((d) => d.key === '2026-09-18')?.isPast).toBe(true);
    const inLosAngeles = buildCalendar(month, [late], now, LOS_ANGELES);
    expect(inLosAngeles.find((d) => d.key === '2026-09-10')?.posts).toHaveLength(1);
    expect(inLosAngeles.find((d) => d.isToday)?.key).toBe('2026-09-18');
    expect(dayKeyIn(now, KOLKATA)).toBe('2026-09-19');
  });

  it("plans a new post for 10:00, or the next whole hour, on the workspace's clock", () => {
    const morning = new Date('2026-09-19T02:45:00Z'); // 08:15 in Kolkata
    const afternoon = new Date('2026-09-19T08:50:00Z'); // 14:20 in Kolkata
    expect(defaultScheduleTime('2026-09-19', morning, KOLKATA).toISOString()).toBe(
      '2026-09-19T04:30:00.000Z',
    );
    expect(defaultScheduleTime('2026-09-19', afternoon, KOLKATA).toISOString()).toBe(
      '2026-09-19T09:30:00.000Z',
    );
    expect(defaultScheduleTime('2026-09-25', afternoon, KOLKATA).toISOString()).toBe(
      '2026-09-25T04:30:00.000Z',
    );
    expect(wallClock('2026-09-19', 9, UTC).toISOString()).toBe('2026-09-19T09:00:00.000Z');
  });
});
