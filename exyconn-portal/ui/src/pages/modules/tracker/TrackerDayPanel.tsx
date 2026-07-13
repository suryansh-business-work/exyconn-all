import { Box, Divider, Flex, Grid, Heading, Text, CircularProgress } from '@/components/ui';
import { formatDuration, activityPercent } from './tracker.format';
import { TrackerAppUsageList } from './TrackerAppUsageList';
import { TrackerScreenshotGallery } from './TrackerScreenshotGallery';
import type { DateTimeFormatter, TrackerDayData } from './tracker.types';

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
  formatDateTime: DateTimeFormatter;
}

/** Presentational day breakdown: totals, key/mouse counts, apps and screenshots. */
export function TrackerDayPanel({
  day,
  loading,
  selected,
  dayLabel,
  formatDateTime,
}: Readonly<TrackerDayPanelProps>) {
  if (!selected) return <PanelMessage text="Select a day to see the breakdown." />;
  if (loading) {
    return (
      <Flex justifyContent="center" sx={{ py: 4 }}>
        <CircularProgress size={22} aria-label="Loading day" />
      </Flex>
    );
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
      <Heading level={6} sx={{ mb: 1 }}>
        {dayLabel}
      </Heading>
      <Grid container spacing={1.5}>
        <Grid item xs={4}>
          <Metric label="Worked" value={formatDuration(totals.activeMs)} />
        </Grid>
        <Grid item xs={4}>
          <Metric label="Idle" value={formatDuration(totals.idleMs)} />
        </Grid>
        <Grid item xs={4}>
          <Metric label="Activity" value={`${activityPercent(totals.activeMs, totals.idleMs)}%`} />
        </Grid>
        <Grid item xs={6}>
          <Metric label="Keystrokes" value={totals.keyCount.toLocaleString()} />
        </Grid>
        <Grid item xs={6}>
          <Metric label="Mouse events" value={totals.mouseCount.toLocaleString()} />
        </Grid>
      </Grid>

      <Divider sx={{ my: 1.5 }} />
      <Heading level={6} sx={{ mb: 1 }}>
        Top apps
      </Heading>
      <TrackerAppUsageList apps={day.appUsage} />

      <Divider sx={{ my: 1.5 }} />
      <Heading level={6} sx={{ mb: 1 }}>
        Screenshots
      </Heading>
      <TrackerScreenshotGallery screenshots={day.screenshots} formatDateTime={formatDateTime} />
    </Box>
  );
}
