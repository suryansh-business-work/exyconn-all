import { useMemo } from 'react';
import { Box, Chip, Grid, Flex, Text, Paragraph } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { StatCard } from '@exyconn/shell/components/dashboard/StatCard';
import { LineChart } from '@exyconn/shell/components/dashboard/LineChart';
import { glass } from '@exyconn/shell/components/glass/glass';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
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
} from '@exyconn/shell/graphql/generated';
import {
  todayAttendance,
  pendingLeave,
  newJoiners,
  upcomingAnniversaries,
  type AttendanceRow,
  type LeaveRow,
  type UserRow,
} from './dashboard/hrDashboard.selectors';
import { buildHrTiles } from './dashboard/hrDashboard.tiles';
import { HrPendingLeave } from './dashboard/HrPendingLeave';
import { HrUpcomingHolidays } from './dashboard/HrUpcomingHolidays';
import { HrNewJoiners } from './dashboard/HrNewJoiners';
import { HrAnnouncements } from './dashboard/HrAnnouncements';
import { HrAnniversaries } from './dashboard/HrAnniversaries';

const policy = { fetchPolicy: 'cache-and-network' } as const;

/** HR Dashboard — the morning view: workforce, today, and everything waiting on HR. */
export function HrDashboardPage() {
  const { data, loading } = useHrDashboardQuery(policy);
  const users = useListUsersQuery(policy);
  const attendance = useListAttendanceQuery(policy);
  const leave = useListLeaveRequestsQuery(policy);
  const holidays = useListHolidaysQuery(policy);
  const requests = useListEmployeeRequestsStatsQuery(policy);
  const goals = useListGoalsStatsQuery(policy);
  const reviews = useListPerformanceReviewsStatsQuery(policy);
  const exits = useListExitRecordsStatsQuery(policy);
  const announcements = useActiveAnnouncementsQuery(policy);
  const { formatDate } = useSettings();

  const dash = data?.hrDashboard;
  const headcount = dash?.headcount ?? [];

  const derived = useMemo(() => {
    const now = new Date();
    const userRows = (users.data?.listUsers ?? []) as UserRow[];
    return {
      userRows,
      joiners: newJoiners(userRows, now),
      anniversaries: upcomingAnniversaries(userRows, now),
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

  return (
    <Box>
      <PageHeader title="HR Dashboard" subtitle="Workforce, today, and what is waiting on you" />

      <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
        {tiles.map((tile) => (
          <Grid key={tile.label} item xs={6} sm={4} md={3} lg={2}>
            <StatCard {...tile} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
        <Grid item xs={12} md={4}>
          <HrPendingLeave rows={derived.pending.slice(0, 6)} formatDate={formatDate} />
        </Grid>
        <Grid item xs={12} md={4}>
          <HrNewJoiners users={derived.joiners.slice(0, 6)} formatDate={formatDate} />
        </Grid>
        <Grid item xs={12} md={4}>
          <HrUpcomingHolidays holidays={derived.nextHolidays} formatDate={formatDate} />
        </Grid>
      </Grid>

      <Grid container spacing={1.5}>
        <Grid item xs={12} md={7}>
          <Box sx={[glass, { p: 2, height: '100%' }]}>
            <Flex direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Text size="label">Employee count over time</Text>
              <Chip label={`${headcount.length} months`} size="small" variant="outlined" />
            </Flex>
            {headcount.length > 1 ? (
              <LineChart
                labels={headcount.map((p) => p.label)}
                data={headcount.map((p) => p.count)}
                color="#155dfc"
              />
            ) : (
              <Paragraph color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                {loading ? 'Loading…' : 'Not enough history to chart yet.'}
              </Paragraph>
            )}
          </Box>
        </Grid>
        <Grid item xs={12} md={5}>
          <Grid container spacing={1.5}>
            <Grid item xs={12}>
              <HrAnnouncements
                rows={(announcements.data?.activeAnnouncements ?? []).slice(0, 4)}
                formatDate={formatDate}
              />
            </Grid>
            <Grid item xs={12}>
              <HrAnniversaries
                anniversaries={derived.anniversaries.slice(0, 5)}
                formatDate={(d) => formatDate(d.toISOString())}
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}
