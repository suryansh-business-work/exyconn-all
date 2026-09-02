import { format } from 'date-fns';
import { Box, Text, Chip } from '@exyconn/shell/components/ui';
import type { DayMarker } from './buildMonth';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

/** A single day cell — dims out-of-month days and overlays holiday / leave markers. */
function DayCell({ day }: { day: DayMarker }) {
  return (
    <Box
      sx={{
        minHeight: 72,
        p: 0.75,
        borderRadius: 1.5,
        border: 1,
        borderColor: day.isToday ? 'primary.main' : 'divider',
        opacity: day.inMonth ? 1 : 0.4,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.25,
      }}
    >
      <Text size="sm" weight={day.isToday ? 'bold' : 'regular'}>
        {format(day.date, 'd')}
      </Text>
      {day.holiday && (
        <Text size="caption" color="secondary.main" noWrap sx={{ display: 'block' }}>
          {day.holiday}
        </Text>
      )}
      {day.onLeave && <Chip size="small" label="Leave" color="info" />}
    </Box>
  );
}

/** Renders a 7-column month grid: a weekday header row followed by day cells. */
export function MonthGrid({ days }: { days: DayMarker[] }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
      {WEEKDAYS.map((label) => (
        <Text key={label} size="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
          {label}
        </Text>
      ))}
      {days.map((day) => (
        <DayCell key={day.date.toISOString()} day={day} />
      ))}
    </Box>
  );
}
