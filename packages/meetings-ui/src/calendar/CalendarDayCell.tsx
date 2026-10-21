import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import { Box, Button, Text } from '@exyconn/shell/components/ui';
import type { CalendarDay } from './calendar-month';
import type { CalendarEntry } from './calendar-entries';
import { CalendarEntryButton } from './CalendarEntryButton';

const SHOWN_PER_DAY = 3;

interface CalendarDayCellProps {
  day: CalendarDay;
  entries: readonly CalendarEntry[];
  isToday: boolean;
  onOpen: (entry: CalendarEntry) => void;
}

/** One day of the month: its date and up to three entries, the rest behind "+N more". */
export function CalendarDayCell({ day, entries, isToday, onOpen }: Readonly<CalendarDayCellProps>) {
  const t = useT();
  const [expanded, setExpanded] = useState(false);
  const hidden = entries.length - SHOWN_PER_DAY;
  const shown = expanded ? entries : entries.slice(0, SHOWN_PER_DAY);
  return (
    <Box
      sx={{
        minHeight: 104,
        p: 0.5,
        minWidth: 0,
        borderRadius: 1,
        border: 1,
        borderColor: isToday ? 'primary.main' : 'divider',
        bgcolor: day.inMonth ? 'background.paper' : 'action.hover',
      }}
    >
      <Text
        size="sm"
        weight={isToday ? 'bold' : 'regular'}
        color={day.inMonth ? 'text.primary' : 'text.secondary'}
      >
        {day.date.getDate()}
      </Text>
      {shown.map((entry) => (
        <CalendarEntryButton key={entry.id} entry={entry} onOpen={onOpen} />
      ))}
      {hidden > 0 && (
        <Button
          size="small"
          aria-expanded={expanded}
          onClick={() => setExpanded((open) => !open)}
          sx={{ minWidth: 0, minHeight: 24, px: 0.5, py: 0, textTransform: 'none' }}
        >
          {expanded ? t('Show fewer') : t('+{count} more', { count: hidden })}
        </Button>
      )}
    </Box>
  );
}
