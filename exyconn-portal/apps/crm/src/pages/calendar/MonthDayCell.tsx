import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import { Box, Button, Text } from '@exyconn/shell/components/ui';
import { CalendarItemButton } from './CalendarItemButton';
import type { CalendarItem } from './calendar.kinds';

const SHOWN_PER_DAY = 3;

interface MonthDayCellProps {
  date: Date;
  items: readonly CalendarItem[];
  inMonth: boolean;
  isToday: boolean;
}

/** One day of the month: its date and up to three entries, the rest behind "+N more". */
export function MonthDayCell({ date, items, inMonth, isToday }: Readonly<MonthDayCellProps>) {
  const t = useT();
  const [expanded, setExpanded] = useState(false);
  const hidden = items.length - SHOWN_PER_DAY;
  const shown = expanded ? items : items.slice(0, SHOWN_PER_DAY);
  return (
    <Box
      sx={{
        minHeight: { xs: 64, sm: 104 },
        p: 0.5,
        minWidth: 0,
        borderRadius: 1,
        border: 1,
        borderColor: isToday ? 'primary.main' : 'divider',
        bgcolor: inMonth ? 'background.paper' : 'action.hover',
      }}
    >
      <Text
        size="sm"
        weight={isToday ? 'bold' : 'regular'}
        color={inMonth ? 'text.primary' : 'text.secondary'}
      >
        {date.getDate()}
      </Text>
      {shown.map((item) => (
        <CalendarItemButton key={item.id} item={item} />
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
