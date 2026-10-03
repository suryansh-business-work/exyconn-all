import { useState } from 'react';
import { useFormatters, useI18n, useT } from '@exyconn/i18n';
import { Box, Button, ButtonBase, Text } from '@exyconn/shell/components/ui';
import { wallClock, type CalendarDay } from '../calendar.days';
import { CalendarPostItem } from './CalendarPostItem';
import type { CalendarPostRow } from './calendar.status';

const SHOWN_PER_DAY = 3;
/** Midday of the day in the workspace's zone: the instant its date is written from. */
const MIDDAY = 12;

interface CalendarDayCellProps {
  day: CalendarDay<CalendarPostRow>;
  /** Plans a new post on the day (its yyyy-MM-dd key); past days take none. */
  onPlan: (dayKey: string) => void;
  onEdit: (post: CalendarPostRow) => void;
}

/**
 * One day of the month: its date and up to three posts, the rest behind a "+N more" that
 * shows them. Today and later days are a button over the whole cell that plans a post; the
 * posts sit above it.
 */
export function CalendarDayCell({ day, onPlan, onEdit }: Readonly<CalendarDayCellProps>) {
  const t = useT();
  const { formatDate } = useFormatters();
  const { timezone } = useI18n().settings;
  const [expanded, setExpanded] = useState(false);
  const hidden = day.posts.length - SHOWN_PER_DAY;
  const shown = expanded ? day.posts : day.posts.slice(0, SHOWN_PER_DAY);
  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: { xs: 64, sm: 96 },
        p: 0.5,
        minWidth: 0,
        borderRadius: 1,
        border: 1,
        borderColor: day.isToday ? 'primary.main' : 'divider',
        bgcolor: day.inMonth ? 'background.paper' : 'action.hover',
      }}
    >
      {!day.isPast && (
        <ButtonBase
          aria-label={t('Schedule a post on {date}', {
            date: formatDate(wallClock(day.key, MIDDAY, timezone)),
          })}
          onClick={() => onPlan(day.key)}
          sx={{
            position: 'absolute',
            inset: 0,
            borderRadius: 1,
            '&:hover, &.Mui-focusVisible': { bgcolor: 'action.selected' },
            '&.Mui-focusVisible': { outline: 2, outlineColor: 'primary.main' },
          }}
        />
      )}
      <Box sx={{ position: 'relative', pointerEvents: 'none' }}>
        <Text
          size="sm"
          weight={day.isToday ? 'bold' : 'regular'}
          color={day.inMonth ? 'text.primary' : 'text.secondary'}
        >
          {day.date.getDate()}
        </Text>
        {shown.map((post) => (
          <CalendarPostItem key={post.id} post={post} onEdit={onEdit} />
        ))}
        {hidden > 0 && (
          <Button
            size="small"
            aria-expanded={expanded}
            onClick={() => setExpanded((open) => !open)}
            sx={{
              pointerEvents: 'auto',
              minWidth: 0,
              minHeight: 24,
              px: 0.5,
              py: 0,
              textTransform: 'none',
            }}
          >
            {expanded ? t('Show fewer') : t('+{count} more', { count: hidden })}
          </Button>
        )}
      </Box>
    </Box>
  );
}
