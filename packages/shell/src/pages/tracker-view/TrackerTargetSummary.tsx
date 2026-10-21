import type { ReactNode } from 'react';
import ScheduleIcon from '@mui/icons-material/Schedule';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import BeachAccessOutlinedIcon from '@mui/icons-material/BeachAccessOutlined';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import { useT } from '@exyconn/i18n';
import {
  formatHoursMinutes,
  formatSignedHoursMinutes,
  type MonthTarget,
} from '@exyconn/tracker-core';
import { Alert, Box, Flex, Text, color } from '@/components/ui';
import { StatCard } from '@/components/dashboard/StatCard';
import { useWeekLabel } from '@/components/work';

/** What each card means, behind its (i) — the definitions the figures are computed by. */
const INFO = {
  expected:
    'Required working hours based on the employee’s policy, excluding approved leave, holidays and weekly offs.',
  logged:
    'Actual active working time recorded by the tracker, plus approved Off Computer Work. Idle time is not included.',
  deficit:
    'The difference between the expected working hours elapsed so far and the hours actually logged. Days still to come are not counted.',
  leave: 'Approved leave days, and the equivalent working hours taken off the expected hours.',
  idle: 'Time the tracker was running but no keyboard, mouse or system activity was detected. It is never counted as worked time.',
} as const;

interface TrackerTargetSummaryProps {
  target: MonthTarget | null;
  workHoursPerDay: number | null;
  /** The weekdays the employee works (0 is Sunday); null until the contract loads. */
  workDays: readonly number[] | null;
  loading: boolean;
  error: Error | undefined;
  /** The report downloads, beside the hint; left out where there are none to offer. */
  actions?: ReactNode;
}

/**
 * The month against the employee's contract: expected hours, hours logged, the deficit so far
 * (negative while behind), leave and idle time — each card with what it means behind its (i).
 */
export function TrackerTargetSummary({
  target,
  workHoursPerDay,
  workDays,
  loading,
  error,
  actions,
}: Readonly<TrackerTargetSummaryProps>) {
  const t = useT();
  const weekLabel = useWeekLabel();
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 1.5 }}>
        {t('Could not load the expected hours for this month.')}
      </Alert>
    );
  }
  const behind = (target?.deficitMs ?? 0) < 0;
  const deficitAccent = behind ? color.red[500] : color.green[300];
  const leaveValue = t('{days} days (-{hours})', {
    days: target?.leaveDates.size ?? 0,
    hours: formatHoursMinutes(target?.leaveMs ?? 0),
  });
  const hint =
    workHoursPerDay === null || workDays === null
      ? ''
      : t(
          '{hours}h a day on {days}, less holidays and approved leave, which is already taken off the expected hours. Days marked Short fell below it.',
          { hours: workHoursPerDay, days: weekLabel(workDays) },
        );
  return (
    <>
      <Box
        sx={{
          display: 'grid',
          gap: 1.5,
          mb: 1.5,
          gridTemplateColumns: {
            xs: 'minmax(0, 1fr)',
            sm: 'repeat(2, minmax(0, 1fr))',
            md: 'repeat(3, minmax(0, 1fr))',
            lg: 'repeat(5, minmax(0, 1fr))',
          },
        }}
      >
        <StatCard
          label="Expected this month"
          value={formatHoursMinutes(target?.expectedMs ?? 0)}
          icon={ScheduleIcon}
          accent={color.sky[500]}
          info={INFO.expected}
          loading={loading}
        />
        <StatCard
          label="Logged this month"
          value={formatHoursMinutes(target?.workedMs ?? 0)}
          icon={TimerOutlinedIcon}
          accent={color.green[300]}
          info={INFO.logged}
          loading={loading}
        />
        <StatCard
          label="Deficit so far"
          value={formatSignedHoursMinutes(target?.deficitMs ?? 0)}
          icon={TrendingDownIcon}
          accent={deficitAccent}
          info={INFO.deficit}
          loading={loading}
        />
        <StatCard
          label="Leave this month"
          value={leaveValue}
          icon={BeachAccessOutlinedIcon}
          accent={color.indigo[400]}
          info={INFO.leave}
          loading={loading}
        />
        <StatCard
          label="Idle this month"
          value={formatHoursMinutes(target?.idleMs ?? 0)}
          icon={HourglassEmptyIcon}
          accent={color.amber[500]}
          info={INFO.idle}
          loading={loading}
        />
      </Box>
      <Flex
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        gap={1}
        sx={{ mb: 1.5, flexWrap: 'wrap' }}
      >
        <Text size="sm" color="text.secondary">
          {hint}
        </Text>
        {actions}
      </Flex>
    </>
  );
}
