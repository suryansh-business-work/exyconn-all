import { useT } from '@exyconn/i18n';
import { Box, Text } from '@exyconn/shell/components/ui';
import type { CalendarDay } from './calendar-month';
import type { CalendarEntry } from './calendar-entries';
import { CalendarDayCell } from './CalendarDayCell';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const NONE: readonly CalendarEntry[] = [];

export interface CalendarViewProps {
  days: readonly CalendarDay[];
  byDay: ReadonlyMap<string, CalendarEntry[]>;
  today: string;
  onOpen: (entry: CalendarEntry) => void;
}

/** The month as a grid of whole weeks; only the month's own days carry entries. */
export function CalendarMonthGrid({ days, byDay, today, onOpen }: Readonly<CalendarViewProps>) {
  const t = useT();
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 0.5 }}>
      {WEEKDAYS.map((label) => (
        <Text key={label} size="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
          {t(label)}
        </Text>
      ))}
      {days.map((day) => (
        <CalendarDayCell
          key={day.key}
          day={day}
          entries={day.inMonth ? (byDay.get(day.key) ?? NONE) : NONE}
          isToday={day.key === today}
          onOpen={onOpen}
        />
      ))}
    </Box>
  );
}
