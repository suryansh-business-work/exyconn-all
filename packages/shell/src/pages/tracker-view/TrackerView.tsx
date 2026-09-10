import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Box, Flex, Grid, Heading, IconButton, Text, CircularProgress } from '@/components/ui';
import { glass } from '@/components/glass/glass';
import { TrackerCalendar } from './TrackerCalendar';
import { TrackerMonthChart } from './TrackerMonthChart';
import { TrackerDayPanel } from './TrackerDayPanel';
import type { TrackerDayCell } from './buildTrackerMonth';
import type { DateTimeFormatter, TrackerDayBucketData, TrackerDayData } from './tracker.types';

interface TrackerViewProps {
  monthLabel: string;
  onPrev: () => void;
  onNext: () => void;
  loading: boolean;
  days: TrackerDayCell[];
  /** The month's day buckets, for the hours chart under the calendar. */
  buckets: readonly TrackerDayBucketData[];
  selectedDate: string | null;
  onSelectDay: (date: string) => void;
  day: TrackerDayData | undefined;
  dayLoading: boolean;
  dayLabel: string;
  /** The zone the tracker is being read in, from the workspace's own settings. */
  timezone: string;
  formatTime: DateTimeFormatter;
  formatDateTime: DateTimeFormatter;
  empty?: boolean;
}

/** Presentational calendar + day-detail composition shared by both tracker views. */
export function TrackerView({
  monthLabel,
  onPrev,
  onNext,
  loading,
  days,
  buckets,
  selectedDate,
  onSelectDay,
  day,
  dayLoading,
  dayLabel,
  timezone,
  formatTime,
  formatDateTime,
  empty = false,
}: Readonly<TrackerViewProps>) {
  if (empty) {
    return (
      <Box sx={[glass, { p: 4, textAlign: 'center' }]}>
        <Text color="text.secondary">Select an employee to view their tracker.</Text>
      </Box>
    );
  }

  return (
    <>
      <Flex direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
        <IconButton aria-label="Previous month" onClick={onPrev}>
          <ChevronLeftIcon />
        </IconButton>
        <Heading level={6} sx={{ minWidth: 160, textAlign: 'center' }}>
          {monthLabel}
        </Heading>
        <IconButton aria-label="Next month" onClick={onNext}>
          <ChevronRightIcon />
        </IconButton>
        {loading && <CircularProgress size={18} aria-label="Loading calendar" />}
      </Flex>

      <Grid container spacing={1.5}>
        <Grid
          size={{
            xs: 12,
            md: 7,
          }}
        >
          <Box sx={[glass, { p: 1.5 }]}>
            <TrackerCalendar days={days} selectedDate={selectedDate} onSelectDay={onSelectDay} />
          </Box>
          <Box sx={[glass, { p: 2, mt: 1.5 }]}>
            <TrackerMonthChart buckets={buckets} monthLabel={monthLabel} />
          </Box>
        </Grid>
        <Grid
          size={{
            xs: 12,
            md: 5,
          }}
        >
          <Box sx={[glass, { p: 2 }]}>
            <TrackerDayPanel
              day={day}
              loading={dayLoading}
              selected={Boolean(selectedDate)}
              dayLabel={dayLabel}
              timezone={timezone}
              formatTime={formatTime}
              formatDateTime={formatDateTime}
            />
          </Box>
        </Grid>
      </Grid>
    </>
  );
}
