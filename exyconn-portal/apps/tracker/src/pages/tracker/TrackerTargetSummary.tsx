import DownloadRounded from '@mui/icons-material/DownloadRounded';
import ScheduleIcon from '@mui/icons-material/Schedule';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import BeachAccessOutlinedIcon from '@mui/icons-material/BeachAccessOutlined';
import { useT } from '@exyconn/i18n';
import {
  formatHoursMinutes,
  formatSignedHoursMinutes,
  type MonthTarget,
} from '@exyconn/tracker-core';
import { Alert, Button, Flex, Grid, Text, color } from '@exyconn/shell/components/ui';
import { StatCard } from '@exyconn/shell/components/dashboard/StatCard';

interface TrackerTargetSummaryProps {
  target: MonthTarget | null;
  workHoursPerDay: number | null;
  loading: boolean;
  error: Error | undefined;
  downloading: boolean;
  onDownload: () => void;
}

/**
 * The month against the employee's contract — expected hours, hours logged and the deficit
 * so far (negative while behind) — with the month's XLSX report a click away.
 */
export function TrackerTargetSummary({
  target,
  workHoursPerDay,
  loading,
  error,
  downloading,
  onDownload,
}: Readonly<TrackerTargetSummaryProps>) {
  const t = useT();
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 1.5 }}>
        {t('Could not load the expected hours for this month.')}
      </Alert>
    );
  }
  const behind = (target?.deficitMs ?? 0) < 0;
  const deficitAccent = behind ? color.red[500] : color.green[300];
  const leaveDays = target?.leaveDates.size ?? 0;
  const leaveValue = t('{days} days (-{hours})', {
    days: leaveDays,
    hours: formatHoursMinutes(target?.leaveMs ?? 0),
  });
  const hint =
    workHoursPerDay === null
      ? ''
      : t(
          '{hours}h a day, Monday to Friday, less holidays and approved leave, which is already taken off the expected hours. Days marked Short fell below it.',
          { hours: workHoursPerDay },
        );
  return (
    <>
      <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="Expected this month"
            value={formatHoursMinutes(target?.expectedMs ?? 0)}
            icon={ScheduleIcon}
            accent={color.sky[500]}
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="Logged this month"
            value={formatHoursMinutes(target?.workedMs ?? 0)}
            icon={TimerOutlinedIcon}
            accent={color.green[300]}
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="Deficit so far"
            value={formatSignedHoursMinutes(target?.deficitMs ?? 0)}
            icon={TrendingDownIcon}
            accent={deficitAccent}
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="Leave this month"
            value={leaveValue}
            icon={BeachAccessOutlinedIcon}
            accent={color.indigo[400]}
            loading={loading}
          />
        </Grid>
      </Grid>
      <Flex
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1}
        sx={{ mb: 1.5, flexWrap: 'wrap' }}
      >
        <Text size="sm" color="text.secondary">
          {hint}
        </Text>
        <Button
          variant="outlined"
          startIcon={<DownloadRounded />}
          loading={downloading}
          disabled={loading}
          onClick={onDownload}
        >
          {t('Download report (XLSX)')}
        </Button>
      </Flex>
    </>
  );
}
