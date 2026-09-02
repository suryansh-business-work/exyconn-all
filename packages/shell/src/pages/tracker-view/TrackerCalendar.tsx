import { format } from 'date-fns';
import { Box, CardActionArea, Text } from '@/components/ui';
import { formatDuration, activityPercent } from './tracker.format';
import type { TrackerDayCell } from './buildTrackerMonth';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

interface DayCellProps {
  cell: TrackerDayCell;
  selected: boolean;
  onSelect: (date: string) => void;
}

/** A single day cell — dims out-of-month days and shows worked time + activity. */
function DayCell({ cell, selected, onSelect }: Readonly<DayCellProps>) {
  const { bucket } = cell;
  const borderColor = selected ? 'primary.main' : 'divider';
  return (
    <CardActionArea
      disabled={!cell.inMonth}
      onClick={() => onSelect(cell.dateKey)}
      sx={{ borderRadius: 1.5, opacity: cell.inMonth ? 1 : 0.4 }}
    >
      <Box
        sx={{
          minHeight: 76,
          p: 0.75,
          borderRadius: 1.5,
          border: 1,
          borderColor,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.25,
        }}
      >
        <Text size="sm" weight={cell.isToday ? 'bold' : 'regular'}>
          {format(cell.date, 'd')}
        </Text>
        {bucket && (
          <>
            <Text size="caption" weight="medium">
              {formatDuration(bucket.activeMs)}
            </Text>
            <Text size="caption" color="text.secondary">
              {activityPercent(bucket.activeMs, bucket.idleMs)}% active
            </Text>
          </>
        )}
      </Box>
    </CardActionArea>
  );
}

interface TrackerCalendarProps {
  days: TrackerDayCell[];
  selectedDate: string | null;
  onSelectDay: (date: string) => void;
}

/** Presentational month grid: weekday header + clickable day cells. No data hooks. */
export function TrackerCalendar({
  days,
  selectedDate,
  onSelectDay,
}: Readonly<TrackerCalendarProps>) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
      {WEEKDAYS.map((label) => (
        <Text key={label} size="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
          {label}
        </Text>
      ))}
      {days.map((cell) => (
        <DayCell
          key={cell.dateKey}
          cell={cell}
          selected={cell.dateKey === selectedDate}
          onSelect={onSelectDay}
        />
      ))}
    </Box>
  );
}
