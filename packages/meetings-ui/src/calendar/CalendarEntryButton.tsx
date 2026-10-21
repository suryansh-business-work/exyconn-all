import { useFormatters, useT } from '@exyconn/i18n';
import { ButtonBase, Text } from '@exyconn/shell/components/ui';
import type { CalendarEntry } from './calendar-entries';
import { ENTRY_STYLE } from './calendar-kinds';

interface CalendarEntryButtonProps {
  entry: CalendarEntry;
  onOpen: (entry: CalendarEntry) => void;
}

/** One entry: its time and title on a bar in its kind's colour; opens its details. */
export function CalendarEntryButton({ entry, onOpen }: Readonly<CalendarEntryButtonProps>) {
  const t = useT();
  const { formatTime } = useFormatters();
  const style = ENTRY_STYLE[entry.kind];
  const allDay = entry.kind === 'event' && entry.event.allDay;
  const time = allDay ? t('All day') : formatTime(entry.startsAt);
  const label = `${time} ${entry.title}`;
  return (
    <ButtonBase
      onClick={() => onOpen(entry)}
      aria-label={t('{kind}: {label}', { kind: t(style.label), label })}
      title={label}
      sx={{
        display: 'block',
        width: '100%',
        // WCAG 2.2 target size: at least 24px tall.
        minHeight: 24,
        mt: 0.5,
        pl: 0.5,
        borderLeft: 3,
        borderColor: style.tone,
        textAlign: 'left',
        borderRadius: 0.5,
        '&:hover, &.Mui-focusVisible': { bgcolor: 'action.hover' },
        '&.Mui-focusVisible': { outline: 2, outlineColor: 'primary.main' },
      }}
    >
      <Text component="span" size="caption" noWrap sx={{ display: 'block' }}>
        {label}
      </Text>
    </ButtonBase>
  );
}
