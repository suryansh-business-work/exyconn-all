import { useI18n } from '@exyconn/i18n';
import { Box, Text } from '@exyconn/shell/components/ui';
import { formatDay } from './calendar-entries';
import { CalendarEntryButton } from './CalendarEntryButton';
import type { CalendarViewProps } from './CalendarMonthGrid';

/** The month on a phone: each of its days that has something on it, in order. */
export function CalendarAgenda({ days, byDay, today, onOpen }: Readonly<CalendarViewProps>) {
  const { settings } = useI18n();
  const busy = days.flatMap((day) => {
    const entries = day.inMonth ? byDay.get(day.key) : undefined;
    return entries ? [{ day, entries }] : [];
  });
  return (
    <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: 1 }}>
      {busy.map(({ day, entries }) => (
        <Box
          component="li"
          key={day.key}
          sx={{
            p: 1,
            borderRadius: 1,
            border: 1,
            borderColor: day.key === today ? 'primary.main' : 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Text size="sm" weight={day.key === today ? 'bold' : 'medium'}>
            {formatDay(day.key, settings)}
          </Text>
          {entries.map((entry) => (
            <CalendarEntryButton key={entry.id} entry={entry} onOpen={onOpen} />
          ))}
        </Box>
      ))}
    </Box>
  );
}
