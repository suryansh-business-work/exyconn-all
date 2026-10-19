import { useFormatters, useT } from '@exyconn/i18n';
import { Box, Text } from '@exyconn/shell/components/ui';
import { CalendarItemButton } from './CalendarItemButton';
import type { CalendarItem } from './calendar.kinds';

interface AgendaColumnProps {
  date: Date;
  items: readonly CalendarItem[];
  isToday: boolean;
}

/** One day of the week or day view: its date, then every entry in time order with its details. */
export function AgendaColumn({ date, items, isToday }: Readonly<AgendaColumnProps>) {
  const t = useT();
  const { formatDate } = useFormatters();
  return (
    <Box
      sx={{
        minWidth: 0,
        minHeight: { md: 240 },
        p: 1,
        borderRadius: 1,
        border: 1,
        borderColor: isToday ? 'primary.main' : 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Text size="sm" weight={isToday ? 'bold' : 'medium'}>
        {formatDate(date)}
      </Text>
      {items.length === 0 ? (
        <Text size="caption" color="text.secondary">
          {t('Nothing scheduled')}
        </Text>
      ) : (
        items.map((item) => <CalendarItemButton key={item.id} item={item} detailed />)
      )}
    </Box>
  );
}
