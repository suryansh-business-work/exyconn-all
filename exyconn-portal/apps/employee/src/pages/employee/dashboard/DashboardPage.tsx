import { useMemo } from 'react';
import { Box, Grid, Heading, Text, Flex } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { useAuth } from '@exyconn/shell/auth/AuthContext';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { formatMoney } from '@exyconn/shell/utils/money';
import {
  useMyAttendanceQuery,
  useMyLeaveRequestsQuery,
  useListHolidaysQuery,
  useMySalarySlipsQuery,
  useMyPayrollQuery,
  useMySupportTicketsQuery,
} from '@exyconn/shell/graphql/generated';
import { DashboardTiles } from './DashboardTiles';
import { UpcomingHolidays } from './UpcomingHolidays';
import {
  todayAttendance,
  monthAttendance,
  leaveSummary,
  upcomingHolidays,
  latestSalarySlip,
  type AttendanceRecord,
  type LeaveRecord,
  type HolidayRecord,
  type SalarySlipRecord,
} from './dashboard.selectors';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Employee self-service landing: everything due today, at a glance. */
export function DashboardPage() {
  const { user } = useAuth();
  const { formatDate } = useSettings();
  const policy = { fetchPolicy: 'cache-and-network' } as const;

  const attendance = useMyAttendanceQuery(policy);
  const leave = useMyLeaveRequestsQuery(policy);
  const holidays = useListHolidaysQuery(policy);
  const slips = useMySalarySlipsQuery(policy);
  const payroll = useMyPayrollQuery(policy);
  const tickets = useMySupportTicketsQuery(policy);

  const stats = useMemo<StatItem[]>(() => {
    const now = new Date();
    const attendanceRows = (attendance.data?.myAttendance ?? []) as AttendanceRecord[];
    const leaveRows = (leave.data?.myLeaveRequests ?? []) as LeaveRecord[];
    const slipRows = (slips.data?.mySalarySlips ?? []) as SalarySlipRecord[];

    const today = todayAttendance(attendanceRows, now);
    const month = monthAttendance(attendanceRows, now);
    const leaves = leaveSummary(leaveRows, now);
    const latest = latestSalarySlip(slipRows);
    const structure = payroll.data?.myPayroll;
    const openTickets = (tickets.data?.mySupportTickets ?? []).filter(
      (t) => t.status !== 'CLOSED',
    ).length;

    return [
      { label: 'Today', value: today?.status.replace('_', ' ') ?? 'Not marked', accent: '#155dfc' },
      { label: 'Present this month', value: String(month.PRESENT), accent: '#16a34a' },
      { label: 'Work from home', value: String(month.WFH), accent: '#0ea5e9' },
      { label: 'Leave pending', value: String(leaves.pending), accent: '#f97316' },
      {
        label: `Leave taken ${now.getFullYear()}`,
        value: `${leaves.approvedDays} d`,
        accent: '#a855f7',
      },
      {
        label: 'Latest slip',
        value: latest ? `${MONTHS[latest.month - 1]} ${latest.year}` : '—',
        accent: '#0891b2',
      },
      {
        label: 'Monthly net',
        value: structure ? formatMoney(structure.net, structure.currency) : '—',
        accent: '#16a34a',
      },
      { label: 'Open tickets', value: String(openTickets), accent: '#ef4444' },
    ];
  }, [attendance.data, leave.data, slips.data, payroll.data, tickets.data]);

  const nextHolidays = useMemo(
    () => upcomingHolidays((holidays.data?.listHolidays ?? []) as HolidayRecord[], new Date()),
    [holidays.data],
  );

  const firstName = user?.name.split(' ')[0] ?? 'there';

  return (
    <Box>
      <PageHeader title={`Hello, ${firstName}`} subtitle="Your workspace at a glance" />
      <DashboardTiles stats={stats} />

      <Grid container spacing={2}>
        <Grid item xs={12} md={5}>
          <UpcomingHolidays holidays={nextHolidays} formatDate={formatDate} />
        </Grid>
        <Grid item xs={12} md={7}>
          <Box sx={{ p: 2 }}>
            <Heading level={6}>Recent leave</Heading>
            {(leave.data?.myLeaveRequests ?? []).slice(0, 4).map((request) => (
              <Flex key={request.id} direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
                <Text size="sm">
                  {request.type} · {formatDate(request.fromDate)} → {formatDate(request.toDate)}
                </Text>
                <Text size="sm" color="text.secondary">
                  {request.status}
                </Text>
              </Flex>
            ))}
            {(leave.data?.myLeaveRequests ?? []).length === 0 && (
              <Text size="sm" color="text.secondary">
                No leave requests yet.
              </Text>
            )}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
