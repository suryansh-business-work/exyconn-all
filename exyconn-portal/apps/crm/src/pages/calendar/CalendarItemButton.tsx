import { useNavigate } from 'react-router-dom';
import { useFormatters, useT } from '@exyconn/i18n';
import { ButtonBase, Text } from '@exyconn/shell/components/ui';
import { itemLink, KIND_STYLE, type CalendarItem } from './calendar.kinds';

interface CalendarItemButtonProps {
  item: CalendarItem;
  /** Week and day views have room for who it belongs to and what it is about. */
  detailed?: boolean;
}

/** One entry: its time and title on a bar in its kind's colour; opens the record it belongs to. */
export function CalendarItemButton({ item, detailed = false }: Readonly<CalendarItemButtonProps>) {
  const t = useT();
  const navigate = useNavigate();
  const { formatTime } = useFormatters();
  const style = KIND_STYLE[item.kind];
  const time = formatTime(item.startAt);
  const label = `${time} ${item.title}`;
  const about = [item.relatedName, item.person].filter(Boolean).join(' · ');
  return (
    <ButtonBase
      onClick={() => navigate(itemLink(item))}
      aria-label={t('{kind}: {label}', { kind: t(style.label), label })}
      title={about ? `${label} — ${about}` : label}
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
      <Text
        component="span"
        size="caption"
        noWrap
        sx={{ display: 'block', textDecoration: item.done ? 'line-through' : 'none' }}
      >
        {label}
      </Text>
      {detailed && about && (
        <Text
          component="span"
          size="caption"
          color="text.secondary"
          noWrap
          sx={{ display: 'block' }}
        >
          {about}
        </Text>
      )}
    </ButtonBase>
  );
}
