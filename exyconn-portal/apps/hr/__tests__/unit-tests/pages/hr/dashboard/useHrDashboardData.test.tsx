import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as gql from '@exyconn/shell/graphql/generated';
import { useHrDashboardData } from '../../../../../src/pages/hr/dashboard/useHrDashboardData';
import { renderHookWithProviders } from '../../../test-utils';
import { queryResult } from '../../../harness/gql-doubles';
import { tableStats } from '../../../harness/crud-page';

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useHrDashboardQuery: vi.fn(),
  useListUsersQuery: vi.fn(),
  useListAttendanceQuery: vi.fn(),
  useListLeaveRequestsQuery: vi.fn(),
  useListHolidaysQuery: vi.fn(),
  useListEmployeeRequestsStatsQuery: vi.fn(),
  useListGoalsStatsQuery: vi.fn(),
  useListPerformanceReviewsStatsQuery: vi.fn(),
  useListExitRecordsStatsQuery: vi.fn(),
  useActiveAnnouncementsQuery: vi.fn(),
  useProbationsEndingQuery: vi.fn(),
}));

const NOW = new Date('2026-03-15T10:00:00.000Z');

const users = [
  { id: 'u1', name: 'Asha', joinDate: '2026-03-02T00:00:00.000Z', isActive: true },
  { id: 'u2', name: 'Bilal', joinDate: '2021-03-20T00:00:00.000Z', isActive: true },
  { id: 'u3', name: 'Chen', dateOfBirth: '1990-03-16T00:00:00.000Z', isActive: true },
];

type Answer = ReturnType<typeof queryResult>;

/** Every query answered; `patch` overrides one query's result by hook name. */
function answerAll(patch: Partial<Record<keyof typeof gql, Answer>> = {}) {
  const answers: Partial<Record<keyof typeof gql, Answer>> = {
    useHrDashboardQuery: queryResult({
      hrDashboard: { totalEmployees: 40, activeEmployees: 37, onLeave: 2, headcount: [] },
    }),
    useListUsersQuery: queryResult({ listUsers: users }),
    useListAttendanceQuery: queryResult({
      listAttendance: [{ date: '2026-03-15T09:00:00.000Z', status: 'WFH' }],
    }),
    useListLeaveRequestsQuery: queryResult({
      listLeaveRequests: [
        {
          id: 'l1',
          employeeId: 'u2',
          type: 'SICK',
          fromDate: '2026-03-18',
          toDate: '2026-03-18',
          status: 'PENDING',
        },
      ],
    }),
    useListHolidaysQuery: queryResult({
      listHolidays: [{ id: 'h1', name: 'Holi', date: '2026-03-20T00:00:00.000Z' }],
    }),
    useListEmployeeRequestsStatsQuery: queryResult({
      listEmployeeRequestsStats: tableStats(3, { status: { PENDING: 3 } }),
    }),
    useListGoalsStatsQuery: queryResult({ listGoalsStats: tableStats(0) }),
    useListPerformanceReviewsStatsQuery: queryResult({
      listPerformanceReviewsStats: tableStats(0),
    }),
    useListExitRecordsStatsQuery: queryResult({ listExitRecordsStats: tableStats(0) }),
    useActiveAnnouncementsQuery: queryResult({ activeAnnouncements: [{ id: 'a1' }] }),
    useProbationsEndingQuery: queryResult({ probationsEnding: [{ id: 'u9', name: 'Dev' }] }),
    ...patch,
  };
  for (const [hook, result] of Object.entries(answers)) {
    vi.mocked(gql[hook as keyof typeof gql] as () => unknown).mockReturnValue(result);
  }
}

const tile = (tiles: { label: string; value: string }[], label: string) =>
  tiles.find((t) => t.label === label)?.value;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
  answerAll();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useHrDashboardData', () => {
  it('derives the day’s picture from every query', () => {
    const { result } = renderHookWithProviders(() => useHrDashboardData());
    const { derived, tiles } = result.current;

    expect(derived.joiners.map((u) => u.id)).toEqual(['u1']);
    expect(derived.anniversaries.map((a) => a.user.id)).toEqual(['u2']);
    expect(derived.birthdays.map((b) => b.user.id)).toEqual(['u3']);
    expect(derived.today.WFH).toBe(1);
    expect(derived.pending.map((p) => p.employeeName)).toEqual(['Bilal']);
    expect(derived.nextHolidays.map((h) => h.name)).toEqual(['Holi']);
    expect(tile(tiles, 'Employees')).toBe('40');
    expect(tile(tiles, 'Active / inactive')).toBe('37 / 3');
    expect(tile(tiles, 'On leave')).toBe('2');
    expect(tile(tiles, 'Requests pending')).toBe('3');
    expect(result.current.probationRows).toEqual([{ id: 'u9', name: 'Dev' }]);
    expect(result.current.announcementRows).toEqual([{ id: 'a1' }]);
    expect(result.current.loading).toEqual({
      tiles: false,
      users: false,
      pendingLeave: false,
      holidays: false,
      probations: false,
      announcements: false,
    });
  });

  it('counts the people list and zeros until the dashboard summary arrives', () => {
    answerAll({ useHrDashboardQuery: queryResult(undefined, { loading: true }) });
    const { result } = renderHookWithProviders(() => useHrDashboardData());

    expect(tile(result.current.tiles, 'Employees')).toBe('3');
    expect(tile(result.current.tiles, 'Active / inactive')).toBe('0 / 3');
    expect(tile(result.current.tiles, 'On leave')).toBe('0');
    expect(result.current.headcount).toEqual([]);
    expect(result.current.headcountLoading).toBe(true);
    expect(result.current.loading.tiles).toBe(true);
  });

  it('marks each card loading only until its own first answer', () => {
    const waiting = queryResult(undefined, { loading: true });
    answerAll({
      useListUsersQuery: waiting,
      useListHolidaysQuery: waiting,
      useProbationsEndingQuery: waiting,
      useActiveAnnouncementsQuery: waiting,
      useListLeaveRequestsQuery: queryResult({ listLeaveRequests: [] }, { loading: true }),
    });
    const { result } = renderHookWithProviders(() => useHrDashboardData());

    expect(result.current.loading).toEqual({
      tiles: true,
      users: true,
      pendingLeave: true,
      holidays: true,
      probations: true,
      announcements: true,
    });
    expect(result.current.derived.userRows).toEqual([]);
    expect(result.current.probationRows).toEqual([]);
    expect(result.current.announcementRows).toEqual([]);
  });

  it('marks pending leave loading while the leave list waits, even with people known', () => {
    answerAll({
      useListLeaveRequestsQuery: queryResult(undefined, { loading: true }),
      useListAttendanceQuery: queryResult(undefined),
    });
    const { result } = renderHookWithProviders(() => useHrDashboardData());

    expect(result.current.loading.users).toBe(false);
    expect(result.current.loading.pendingLeave).toBe(true);
    expect(result.current.derived.pending).toEqual([]);
    expect(result.current.derived.today).toEqual({ PRESENT: 0, ABSENT: 0, WFH: 0, HALF_DAY: 0 });
  });

  it('keeps the headcount the summary carries', () => {
    const headcount = [
      { label: 'Feb', count: 38 },
      { label: 'Mar', count: 40 },
    ];
    answerAll({
      useHrDashboardQuery: queryResult({
        hrDashboard: { totalEmployees: 40, activeEmployees: 40, onLeave: 0, headcount },
      }),
      useListHolidaysQuery: queryResult(undefined),
    });
    const { result } = renderHookWithProviders(() => useHrDashboardData());
    expect(result.current.headcount).toEqual(headcount);
    expect(result.current.derived.nextHolidays).toEqual([]);
  });
});
