import { Box, Divider, Flex, Grid, Heading, Text } from '@/components/ui';
import { formatDuration, activityPercent } from './tracker.format';
import { TrackerDayCharts } from './TrackerDayCharts';
import { TrackerDayProjects } from './TrackerDayProjects';
import { TrackerScreenshotGallery } from './TrackerScreenshotGallery';
import type { DateTimeFormatter, TrackerDayData, TrackerDayMark } from './tracker.types';
import { TrackerStatusChip } from './TrackerStatusChip';
import { PanelSkeleton } from '@/components/feedback/skeletons';

const EMPTY_TOTALS = { activeMs: 0, idleMs: 0, keyCount: 0, mouseCount: 0 };

/** A short centred placeholder message used while empty / loading. */
function PanelMessage({ text }: Readonly<{ text: string }>) {
  return (
    <Flex justifyContent="center" sx={{ py: 4 }}>
      <Text size="sm" color="text.secondary">
        {text}
      </Text>
    </Flex>
  );
}

/** A single labelled metric tile. */
function Metric({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <Box>
      <Text size="caption" color="text.secondary">
        {label}
      </Text>
      <Text size="sm" weight="bold" sx={{ display: 'block' }}>
        {value}
      </Text>
    </Box>
  );
}

interface TrackerDayPanelProps {
  day: TrackerDayData | undefined;
  loading: boolean;
  selected: boolean;
  dayLabel: string;
  /** The zone the day is read in — it decides which hour each screenshot belongs to. */
  timezone: string;
  formatTime: DateTimeFormatter;
  formatDateTime: DateTimeFormatter;
  /** The day's status on the calendar, when it has one. */
  status?: TrackerDayMark;
  /** Approved off-computer work on the day, counted in its worked time. */
  offComputerMs?: number;
}

/** Presentational day breakdown: totals, key/mouse counts, apps and screenshots. */
export function TrackerDayPanel({
  day,
  loading,
  selected,
  dayLabel,
  timezone,
  formatTime,
  formatDateTime,
  status,
  offComputerMs = 0,
}: Readonly<TrackerDayPanelProps>) {
  if (!selected) return <PanelMessage text="Select a day to see the breakdown." />;
  if (loading) {
    return <PanelSkeleton lines={6} bare label="Loading day" />;
  }
  if (!day) return <PanelMessage text="No activity for this day." />;

  const totals = day.sessions.reduce(
    (acc, session) => ({
      activeMs: acc.activeMs + session.activeMs,
      idleMs: acc.idleMs + session.idleMs,
      keyCount: acc.keyCount + session.keyCount,
      mouseCount: acc.mouseCount + session.mouseCount,
    }),
    EMPTY_TOTALS,
  );

  return (
    <Box>
      <Flex direction="row" alignItems="center" gap={1} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
        <Heading level={6}>{dayLabel}</Heading>
        {status && <TrackerStatusChip status={status} />}
      </Flex>
      <Grid container spacing={1.5}>
        <Grid size={{ xs: 6, sm: 4 }}>
          <Metric label="Active time" value={formatDuration(totals.activeMs)} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <Metric label="Idle" value={formatDuration(totals.idleMs)} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <Metric label="Activity" value={`${activityPercent(totals.activeMs, totals.idleMs)}%`} />
        </Grid>
        {offComputerMs > 0 && (
          <Grid size={{ xs: 6, sm: 4 }}>
            <Metric label="Off Computer Work" value={formatDuration(offComputerMs)} />
          </Grid>
        )}
        <Grid size={6}>
          <Metric label="Keystrokes" value={totals.keyCount.toLocaleString()} />
        </Grid>
        <Grid size={6}>
          <Metric label="Mouse events" value={totals.mouseCount.toLocaleString()} />
        </Grid>
      </Grid>

      <Divider sx={{ my: 1.5 }} />
      <TrackerDayCharts day={day} timezone={timezone} />

      <Divider sx={{ my: 1.5 }} />
      <Heading level={6} sx={{ mb: 1 }}>
        Projects
      </Heading>
      <TrackerDayProjects sessions={day.sessions} />

      <Divider sx={{ my: 1.5 }} />
      <Heading level={6} sx={{ mb: 1 }}>
        Screenshots
      </Heading>
      <TrackerScreenshotGallery
        screenshots={day.screenshots}
        timezone={timezone}
        formatTime={formatTime}
        formatDateTime={formatDateTime}
      />
    </Box>
  );
}
