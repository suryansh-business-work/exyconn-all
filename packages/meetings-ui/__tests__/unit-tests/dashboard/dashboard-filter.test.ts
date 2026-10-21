import { describe, expect, it } from 'vitest';
import { endOfDay, startOfDay } from 'date-fns';
import { MaLanguage, MaMeetingStatus, MaScope } from '@exyconn/shell/graphql/generated';
import { dayParam, paramDay, toDashboardFilter } from '../../../src/dashboard/dashboard-filter';

describe('paramDay / dayParam', () => {
  it('round-trips a calendar day through the URL', () => {
    const day = paramDay('2026-10-20');
    expect(day?.getFullYear()).toBe(2026);
    expect(dayParam(day)).toBe('2026-10-20');
  });

  it('treats an absent, malformed or half-typed day as no day', () => {
    expect(paramDay(null)).toBeNull();
    expect(paramDay('not-a-day')).toBeNull();
    expect(dayParam(null)).toBeNull();
    expect(dayParam(new Date(Number.NaN))).toBeNull();
  });
});

describe('toDashboardFilter', () => {
  it('turns every URL param into the query filter, the range covering whole days', () => {
    const params = new URLSearchParams(
      'from=2026-10-01&to=2026-10-31&organizer=u1&participant=u2&status=ENDED&language=HINDI',
    );
    expect(toDashboardFilter(params, 'ALL')).toEqual({
      scope: MaScope.All,
      from: startOfDay(new Date(2026, 9, 1)).toISOString(),
      to: endOfDay(new Date(2026, 9, 31)).toISOString(),
      ownerId: 'u1',
      participantUserId: 'u2',
      status: MaMeetingStatus.Ended,
      language: MaLanguage.Hindi,
    });
  });

  it("ignores the organizer on one's own meetings, and values that are not real", () => {
    const params = new URLSearchParams('organizer=u1&status=LOST&language=KLINGON');
    expect(toDashboardFilter(params, 'MINE')).toEqual({
      scope: MaScope.Mine,
      from: undefined,
      to: undefined,
      ownerId: undefined,
      participantUserId: undefined,
      status: undefined,
      language: undefined,
    });
  });
});
