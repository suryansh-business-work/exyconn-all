import { format } from 'date-fns';
import { Box, Text, Chip } from '@exyconn/shell/components/ui';
import type { DayMarker } from './buildMonth';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

/** A single day cell — dims out-of-month days and overlays holiday / leave markers. */
function DayCell({ day }: { day: DayMarker }) {
  return (
    <Box
      sx={{
        minHeight: { xs: 56, sm: 72 },
        // A cell is about 40px wide on a phone; padding at that size leaves no room for the
        // date itself, let alone what is happening on it.
        p: { xs: 0.5, sm: 1 },
        minWidth: 0,
        borderRadius: 1.5,
        border: 1,
        borderColor: day.isToday ? 'primary.main' : 'divider',
        opacity: day.inMonth ? 1 : 0.4,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5,
      }}
    >
      <Text size="sm" weight={day.isToday ? 'bold' : 'regular'}>
        {format(day.date, 'd')}
      </Text>
      {day.holiday && (
        // Clipped rather than truncated on a phone: with 40px to work in, an ellipsis is the
        // whole word. The month list underneath names the holiday in full.
        <Text
          size="caption"
          color="secondary.main"
          noWrap
          sx={{ display: { xs: 'none', sm: 'block' } }}
        >
          {day.holiday}
        </Text>
      )}
      {day.holiday && (
        <Box
          aria-label={day.holiday}
          sx={{
            display: { xs: 'block', sm: 'none' },
            width: 6,
            height: 6,
            borderRadius: '50%',
            bgcolor: 'secondary.main',
          }}
        />
      )}
      {day.onLeave && (
        <>
          <Chip
            size="small"
            label="Leave"
            color="info"
            sx={{ display: { xs: 'none', sm: 'flex' } }}
          />
          <Box
            aria-label="On leave"
            sx={{
              display: { xs: 'block', sm: 'none' },
              width: 6,
              height: 6,
              borderRadius: '50%',
              bgcolor: 'info.main',
            }}
          />
        </>
      )}
    </Box>
  );
}

/** Renders a 7-column month grid: a weekday header row followed by day cells. */
export function MonthGrid({ days }: { days: DayMarker[] }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
        gap: { xs: 0.5, sm: 0.5 },
      }}
    >
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
