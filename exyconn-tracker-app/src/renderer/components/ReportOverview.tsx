import type { ReactElement } from 'react';
import { useState } from 'react';
import {
  Alert,
  Box,
  borderWidth,
  Chip,
  letterSpacing,
  Skeleton,
  Stack,
  Typography,
} from '@exyconn/ui';
import type { CSSObject, Theme } from '@exyconn/ui';
import KeyboardOutlined from '@mui/icons-material/KeyboardOutlined';
import MouseOutlined from '@mui/icons-material/MouseOutlined';
import TimerOutlined from '@mui/icons-material/TimerOutlined';
import EventAvailableOutlined from '@mui/icons-material/EventAvailableOutlined';
import {
  formatCount,
  formatDayLabel,
  formatHoursMinutes,
  relativeChange,
  type PeriodLength,
  type PeriodTotals,
} from '@exyconn/tracker-core';
import { selectedFill } from '../theme';
import usePeriodInsights from '../hooks/usePeriodInsights';
import ActivityCard from './ActivityCard';
import ChangeBadge from './ChangeBadge';
import GradientBar from './GradientBar';
import MetricCard from './MetricCard';
import StripesChart from './StripesChart';
import Surface from './Surface';

const PERIODS: ReadonlyArray<{ length: PeriodLength; label: string; before: string }> = [
  { length: 7, label: 'Last 7 days', before: 'the 7 days before' },
  { length: 30, label: 'Last 30 days', before: 'the 30 days before' },
];

type CountKey = 'keyCount' | 'mouseCount' | 'sessions' | 'trackedDays';

const METRICS: ReadonlyArray<{ key: CountKey; label: string; icon: typeof KeyboardOutlined }> = [
  { key: 'keyCount', label: 'Keystrokes', icon: KeyboardOutlined },
  { key: 'mouseCount', label: 'Mouse clicks', icon: MouseOutlined },
  { key: 'sessions', label: 'Sessions', icon: TimerOutlined },
  { key: 'trackedDays', label: 'Days tracked', icon: EventAvailableOutlined },
];

interface Props {
  timezone: string;
}

/** A period chip that is not showing: paper with a hairline, as the phone draws it. */
function unselectedChip(theme: Theme): CSSObject {
  return {
    backgroundColor: theme.palette.background.paper,
    border: `${borderWidth.hairline}px solid ${theme.palette.divider}`,
  };
}

/** The period's worked time, how active it was, and how both moved against the period before. */
function WorkedCard({
  current,
  previous,
  before,
}: Readonly<{ current: PeriodTotals; previous: PeriodTotals; before: string }>): ReactElement {
  const change = relativeChange(current.activeMs, previous.activeMs);
  return (
    <Surface sx={{ p: 2.5 }}>
      <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
        Worked
      </Typography>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', my: 1 }}>
        <Typography variant="h3" sx={{ fontWeight: 700, letterSpacing: letterSpacing.tighter }}>
          {formatHoursMinutes(current.activeMs)}
        </Typography>
        {change === null ? null : <ChangeBadge change={change} />}
      </Stack>
      <GradientBar
        percent={current.activityPercent}
        label="Active"
        trailing={`${formatHoursMinutes(current.idleMs)} idle`}
        ariaLabel={`${current.activityPercent}% of tracked time was active`}
      />
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1 }}>
        {formatHoursMinutes(previous.activeMs)} {before}.
      </Typography>
    </Surface>
  );
}

/**
 * The report's first tab: the last 7 or 30 days at a glance — worked time, a day-by-day
 * stripes chart, and the counts — each against the equally long period before it. Every figure
 * is the portal's own; a period with nothing before it shows no change rather than an invented one.
 */
export default function ReportOverview({ timezone }: Readonly<Props>): ReactElement {
  const [length, setLength] = useState<PeriodLength>(7);
  const period = PERIODS.find((entry) => entry.length === length) ?? PERIODS[0];
  const { range, current, previous, columns, loading, error } = usePeriodInsights(length, timezone);
  const first = range.current[0];
  const last = range.current.at(-1) ?? first;
  const middle = range.current[Math.floor(range.current.length / 2)];

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} role="group" aria-label="Period">
        {PERIODS.map((entry) => (
          <Chip
            key={entry.length}
            label={entry.label}
            clickable
            aria-pressed={entry.length === length}
            onClick={() => setLength(entry.length)}
            sx={(theme) => ({
              height: 40,
              px: 1,
              fontSize: theme.typography.body2.fontSize,
              ...(entry.length === length ? selectedFill(theme) : unselectedChip(theme)),
            })}
          />
        ))}
      </Stack>

      {error === null ? null : (
        <Alert severity="error" variant="outlined">
          {error}
        </Alert>
      )}

      {loading ? (
        <Skeleton variant="rounded" height={180} />
      ) : (
        <WorkedCard current={current} previous={previous} before={period.before} />
      )}

      <ActivityCard title="Over time" percent={loading ? null : current.activityPercent}>
        <StripesChart
          bars={columns}
          labels={{
            start: formatDayLabel(first),
            middle: formatDayLabel(middle),
            end: formatDayLabel(last),
          }}
          summary={`Hours worked per day, ${period.label.toLowerCase()}; ${current.trackedDays} days tracked.`}
        />
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1 }}>
          Each stripe is a day: its height is the time worked, its colour how active it was.
        </Typography>
      </ActivityCard>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
        {METRICS.map((metric) => (
          <MetricCard
            key={metric.key}
            label={metric.label}
            icon={metric.icon}
            value={formatCount(current[metric.key])}
            change={relativeChange(current[metric.key], previous[metric.key])}
            caption={`${formatCount(previous[metric.key])} ${period.before}`}
          />
        ))}
      </Box>
    </Stack>
  );
}
