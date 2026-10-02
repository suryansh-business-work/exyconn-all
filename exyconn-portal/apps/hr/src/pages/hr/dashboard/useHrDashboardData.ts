import { useMemo } from 'react';
import { upcomingHolidays } from '@exyconn/shell/utils/upcomingHolidays';
import {
  useHrDashboardQuery,
  useListUsersQuery,
  useListAttendanceQuery,
  useListLeaveRequestsQuery,
  useListHolidaysQuery,
  useListEmployeeRequestsStatsQuery,
  useListGoalsStatsQuery,
  useListPerformanceReviewsStatsQuery,
  useListExitRecordsStatsQuery,
  useActiveAnnouncementsQuery,
  useProbationsEndingQuery,
} from '@exyconn/shell/graphql/generated';
import {
  todayAttendance,
  pendingLeave,
  newJoiners,
  upcomingAnniversaries,
  upcomingBirthdays,
  type AttendanceRow,
  type LeaveRow,
  type UserRow,
} from './hrDashboard.selectors';
import { buildHrTiles } from './hrDashboard.tiles';

const policy = { fetchPolicy: 'cache-and-network' } as const;

/** True only while a query waits for its first answer — a refetch keeps showing the old data. */
function firstLoad(query: Readonly<{ data?: unknown; loading: boolean }>): boolean {
  return !query.data && query.loading;
}

/** Every query the HR Dashboard reads, what it derives from them, and which are still loading. */
export function useHrDashboardData() {
  const dashboard = useHrDashboardQuery(policy);
  const users = useListUsersQuery(policy);
  const attendance = useListAttendanceQuery(policy);
  const leave = useListLeaveRequestsQuery(policy);
  const holidays = useListHolidaysQuery(policy);
  const requests = useListEmployeeRequestsStatsQuery(policy);
  const goals = useListGoalsStatsQuery(policy);
  const reviews = useListPerformanceReviewsStatsQuery(policy);
  const exits = useListExitRecordsStatsQuery(policy);
  const announcements = useActiveAnnouncementsQuery(policy);
  const probations = useProbationsEndingQuery(policy);

  const dash = dashboard.data?.hrDashboard;

  const derived = useMemo(() => {
    const now = new Date();
    const userRows = (users.data?.listUsers ?? []) as UserRow[];
    return {
      userRows,
      joiners: newJoiners(userRows, now),
      anniversaries: upcomingAnniversaries(userRows, now),
      birthdays: upcomingBirthdays(userRows, now),
      today: todayAttendance((attendance.data?.listAttendance ?? []) as AttendanceRow[], now),
      pending: pendingLeave((leave.data?.listLeaveRequests ?? []) as LeaveRow[], userRows),
      nextHolidays: upcomingHolidays(holidays.data?.listHolidays ?? [], now, 4),
    };
  }, [users.data, attendance.data, leave.data, holidays.data]);

  const tiles = buildHrTiles({
    totalEmployees: dash?.totalEmployees ?? derived.userRows.length,
    activeEmployees: dash?.activeEmployees ?? 0,
    onLeave: dash?.onLeave ?? 0,
    newJoiners: derived.joiners.length,
    today: derived.today,
    pendingLeave: derived.pending.length,
    requestStats: requests.data?.listEmployeeRequestsStats,
    goalStats: goals.data?.listGoalsStats,
    reviewStats: reviews.data?.listPerformanceReviewsStats,
    exitStats: exits.data?.listExitRecordsStats,
  });

  const usersLoading = firstLoad(users);

  return {
    tiles,
    derived,
    headcount: dash?.headcount ?? [],
    headcountLoading: dashboard.loading,
    probationRows: probations.data?.probationsEnding ?? [],
    announcementRows: announcements.data?.activeAnnouncements ?? [],
    loading: {
      tiles: [dashboard, users, attendance, leave, requests, goals, reviews, exits].some(firstLoad),
      users: usersLoading,
      pendingLeave: usersLoading || firstLoad(leave),
      holidays: firstLoad(holidays),
      probations: firstLoad(probations),
      announcements: firstLoad(announcements),
    },
  };
}
