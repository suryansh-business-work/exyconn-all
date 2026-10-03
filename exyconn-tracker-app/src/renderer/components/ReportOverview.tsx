import type { ReactElement } from 'react';
import { useState } from 'react';
import { Alert, Box, borderWidth, Chip, Skeleton, Stack, Typography } from '@exyconn/ui';
import type { CSSObject, Theme } from '@exyconn/ui';
import { useT } from '@exyconn/i18n';
import KeyboardOutlined from '@mui/icons-material/KeyboardOutlined';
import MouseOutlined from '@mui/icons-material/MouseOutlined';
import TimerOutlined from '@mui/icons-material/TimerOutlined';
import EventAvailableOutlined from '@mui/icons-material/EventAvailableOutlined';
import {
  formatCount,
  formatDayLabel,
  relativeChange,
  type PeriodLength,
} from '@exyconn/tracker-core';
import { selectedFill } from '../theme';
import usePeriodInsights from '../hooks/usePeriodInsights';
import ActivityCard from './ActivityCard';
import MetricCard from './MetricCard';
import StripesChart from './StripesChart';
import WorkedCard from './WorkedCard';
import { useAnnounce } from '../a11y/LiveAnnouncer';

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

/** Two figures a row, dropping to one when zoom leaves no room for two (WCAG 1.4.10). */
const GRID_COLUMNS = 'repeat(auto-fit, minmax(min(150px, 100%), 1fr))';

/** The stripes chart's own height, held while the period is on its way. */
const STRIPES_HEIGHT = 140;
const METRIC_HEIGHT = 112;

/** A period chip that is not showing: paper with a hairline, as the phone draws it. */
function unselectedChip(theme: Theme): CSSObject {
  return {
    backgroundColor: theme.palette.background.paper,
    border: `${borderWidth.hairline}px solid ${theme.palette.divider}`,
  };
}

/**
 * The report's first tab: the last 7 or 30 days at a glance — worked time, a day-by-day
 * stripes chart, and the counts — each against the equally long period before it. Every figure
 * is the portal's own; a period with nothing before it shows no change rather than an invented one.
 */
export default function ReportOverview({ timezone }: Readonly<Props>): ReactElement {
  const t = useT();
  const [length, setLength] = useState<PeriodLength>(7);
  const period = PERIODS.find((entry) => entry.length === length) ?? PERIODS[0];
  const { range, current, previous, columns, loading, error } = usePeriodInsights(length, timezone);
  useAnnounce(error, 'assertive');
  const first = range.current[0];
  const last = range.current.at(-1) ?? first;
  const middle = range.current[Math.floor(range.current.length / 2)];

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} role="group" aria-label={t('Period')}>
        {PERIODS.map((entry) => (
          <Chip
            key={entry.length}
            label={t(entry.label)}
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

      <ActivityCard title={t('Over time')} percent={loading ? null : current.activityPercent}>
        {loading ? (
          <Skeleton variant="rounded" height={STRIPES_HEIGHT} />
        ) : (
          <StripesChart
            bars={columns}
            labels={{
              start: formatDayLabel(first),
              middle: formatDayLabel(middle),
              end: formatDayLabel(last),
            }}
            summary={t('Hours worked per day, {period}; {days} days tracked.', {
              period: t(period.label).toLowerCase(),
              days: current.trackedDays,
            })}
          />
        )}
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1 }}>
          {t('Each stripe is a day: its height is the time worked, its colour how active it was.')}
        </Typography>
      </ActivityCard>

      <Box sx={{ display: 'grid', gridTemplateColumns: GRID_COLUMNS, gap: 1.5 }}>
        {METRICS.map((metric) =>
          loading ? (
            <Skeleton key={metric.key} variant="rounded" height={METRIC_HEIGHT} />
          ) : (
            <MetricCard
              key={metric.key}
              label={t(metric.label)}
              icon={metric.icon}
              value={formatCount(current[metric.key])}
              change={relativeChange(current[metric.key], previous[metric.key])}
              caption={t('{count} {before}', {
                count: formatCount(previous[metric.key]),
                before: t(period.before),
              })}
            />
          ),
        )}
      </Box>
    </Stack>
  );
}
