import { format } from 'date-fns';
import { useT } from '@exyconn/i18n';
import { Box, CardActionArea, Text } from '@/components/ui';
import { formatDuration, activityPercent } from './tracker.format';
import type { TrackerDayCell } from './buildTrackerMonth';
import type { TrackerDayMark } from './tracker.types';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

/** Each mark's words and colour — said in words as well, since colour alone reaches fewer. */
const MARKS: Readonly<Record<TrackerDayMark, { label: string; color: string }>> = {
  SHORT: { label: 'Short', color: 'error.main' },
  LEAVE: { label: 'Leave', color: 'info.main' },
  HOLIDAY: { label: 'Holiday', color: 'text.secondary' },
};

interface DayCellProps {
  cell: TrackerDayCell;
  selected: boolean;
  /** Leave, a holiday, or a finished working day below the contracted hours. */
  mark: TrackerDayMark | undefined;
  onSelect: (date: string) => void;
}

/** A single day cell — dims out-of-month days and shows worked time + activity. */
function DayCell({ cell, selected, mark, onSelect }: Readonly<DayCellProps>) {
  const t = useT();
  const { bucket } = cell;
  const shown = mark ? MARKS[mark] : undefined;
  const short = mark === 'SHORT';
  const idleBorder = shown?.color ?? 'divider';
  const borderColor = selected ? 'primary.main' : idleBorder;
  return (
    <CardActionArea
      disabled={!cell.inMonth}
      onClick={() => onSelect(cell.dateKey)}
      sx={{ borderRadius: 1, opacity: cell.inMonth ? 1 : 0.4 }}
    >
      <Box
        sx={{
          minHeight: { xs: 56, sm: 76 },
          // About 40px of cell on a phone: the date has to fit before anything else does.
          p: { xs: 0.5, sm: 1 },
          minWidth: 0,
          borderRadius: 1,
          border: 1,
          borderColor,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
        }}
      >
        <Text
          size="sm"
          weight={cell.isToday ? 'bold' : 'regular'}
          color={short ? 'error.main' : undefined}
        >
          {format(cell.date, 'd')}
        </Text>
        {shown && (
          <Text size="caption" weight="medium" color={shown.color} noWrap>
            {t(shown.label)}
          </Text>
        )}
        {bucket && (
          <>
            <Text size="caption" weight="medium" noWrap>
              {formatDuration(bucket.activeMs)}
            </Text>
            {/* The percentage is the first thing to go when there is no room for it; the day
                panel below says it in full for whichever day is open. */}
            <Text
              size="caption"
              color="text.secondary"
              noWrap
              sx={{ display: { xs: 'none', sm: 'block' } }}
            >
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
  dayMarks?: ReadonlyMap<string, TrackerDayMark>;
}

/** Presentational month grid: weekday header + clickable day cells. No data hooks. */
export function TrackerCalendar({
  days,
  selectedDate,
  onSelectDay,
  dayMarks,
}: Readonly<TrackerCalendarProps>) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 0.5 }}>
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
          mark={cell.inMonth ? dayMarks?.get(cell.dateKey) : undefined}
          onSelect={onSelectDay}
        />
      ))}
    </Box>
  );
}
