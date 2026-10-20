import { Box, Text } from '@/components/ui';
import type { TrackerDayCell } from './buildTrackerMonth';
import type { TrackerDayMark } from './tracker.types';
import { TrackerDayTile } from './TrackerDayTile';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

interface TrackerCalendarProps {
  days: TrackerDayCell[];
  selectedDate: string | null;
  onSelectDay: (date: string) => void;
  dayMarks?: ReadonlyMap<string, TrackerDayMark>;
  /** Each named off day's label: the leave code (EL, CL) or the holiday's name. */
  dayLabels?: ReadonlyMap<string, string>;
}

/** Presentational month grid: weekday header + clickable day cells. No data hooks. */
export function TrackerCalendar({
  days,
  selectedDate,
  onSelectDay,
  dayMarks,
  dayLabels,
}: Readonly<TrackerCalendarProps>) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
        gap: { xs: 0.5, sm: 1 },
      }}
    >
      {WEEKDAYS.map((label) => (
        <Text key={label} size="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
          {label}
        </Text>
      ))}
      {days.map((cell) => (
        <TrackerDayTile
          key={cell.dateKey}
          cell={cell}
          selected={cell.dateKey === selectedDate}
          mark={cell.inMonth ? dayMarks?.get(cell.dateKey) : undefined}
          offLabel={cell.inMonth ? dayLabels?.get(cell.dateKey) : undefined}
          onSelect={onSelectDay}
        />
      ))}
    </Box>
  );
}
