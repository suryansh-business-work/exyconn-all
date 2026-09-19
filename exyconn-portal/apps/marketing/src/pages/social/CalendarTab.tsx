import { useState } from 'react';
import { addMonths, format, startOfMonth, subMonths } from 'date-fns';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useT } from '@exyconn/i18n';
import {
  Box,
  CircularProgress,
  Flex,
  Heading,
  IconButton,
  Text,
} from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';
import { useSocialCalendarQuery } from '@exyconn/shell/graphql/generated';
import { buildCalendar, monthRange, postTime, type CalendarDay } from './calendar.days';
import { NETWORK_LABEL } from './social.labels';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const SHOWN_PER_DAY = 3;

/** Each status's colour and word — the word is always shown, so colour is never the only cue. */
const STATUS_TONE: Readonly<Record<string, { tone: string; label: string }>> = {
  SCHEDULED: { tone: 'warning.main', label: 'Scheduled' },
  PUBLISHING: { tone: 'info.main', label: 'Publishing' },
  PUBLISHED: { tone: 'success.main', label: 'Published' },
  FAILED: { tone: 'error.main', label: 'Failed' },
};

type Post = {
  id: string;
  status: string;
  network: keyof typeof NETWORK_LABEL;
  text: string;
  scheduledAt?: string | null;
  publishedAt?: string | null;
};

/** One day of the month: its date and up to three posts, the rest counted. */
function DayCell({ day }: Readonly<{ day: CalendarDay<Post> }>) {
  const t = useT();
  const hidden = day.posts.length - SHOWN_PER_DAY;
  return (
    <Box
      sx={{
        minHeight: { xs: 64, sm: 96 },
        p: 0.5,
        minWidth: 0,
        borderRadius: 1.5,
        border: 1,
        borderColor: day.isToday ? 'primary.main' : 'divider',
        bgcolor: day.inMonth ? 'background.paper' : 'action.hover',
      }}
    >
      <Text
        size="sm"
        weight={day.isToday ? 'bold' : 'regular'}
        color={day.inMonth ? 'text.primary' : 'text.secondary'}
      >
        {format(day.date, 'd')}
      </Text>
      {day.posts.slice(0, SHOWN_PER_DAY).map((post) => {
        const tone = STATUS_TONE[post.status] ?? STATUS_TONE.SCHEDULED;
        const at = postTime(post);
        const label = `${NETWORK_LABEL[post.network]} ${at ? format(at, 'HH:mm') : ''}`;
        return (
          <Text
            key={post.id}
            size="caption"
            noWrap
            title={`${t(tone.label)}: ${post.text}`}
            sx={{ display: 'block', mt: 0.5, pl: 0.5, borderLeft: 3, borderColor: tone.tone }}
          >
            {label} · {t(tone.label)}
          </Text>
        );
      })}
      {hidden > 0 && (
        <Text size="caption" color="text.secondary">
          {t('+{count} more', { count: hidden })}
        </Text>
      )}
    </Box>
  );
}

/** Social › Calendar: the month's scheduled and published posts, day by day. */
export function CalendarTab() {
  const t = useT();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const { from, to } = monthRange(month);
  const { data, loading, error } = useSocialCalendarQuery({
    variables: { from: from.toISOString(), to: to.toISOString() },
    fetchPolicy: 'cache-and-network',
  });
  const days = buildCalendar(month, (data?.socialCalendar ?? []) as Post[], new Date());

  return (
    <Box sx={panel}>
      <Flex direction="row" alignItems="center" spacing={1} wrap sx={{ mb: 1.5 }}>
        <IconButton
          aria-label={t('Previous month')}
          onClick={() => setMonth((m) => subMonths(m, 1))}
        >
          <ChevronLeftIcon />
        </IconButton>
        <Heading level={6} sx={{ minWidth: 150, textAlign: 'center' }}>
          {format(month, 'MMMM yyyy')}
        </Heading>
        <IconButton aria-label={t('Next month')} onClick={() => setMonth((m) => addMonths(m, 1))}>
          <ChevronRightIcon />
        </IconButton>
        {loading && <CircularProgress size={18} aria-label={t('Loading calendar')} />}
        <Flex direction="row" spacing={1.5} wrap sx={{ ml: 'auto' }}>
          {Object.values(STATUS_TONE).map((status) => (
            <Text
              key={status.label}
              size="caption"
              sx={{ pl: 0.5, borderLeft: 3, borderColor: status.tone }}
            >
              {t(status.label)}
            </Text>
          ))}
        </Flex>
      </Flex>
      {error && <Text color="error">{error.message}</Text>}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 0.5 }}>
        {WEEKDAYS.map((label) => (
          <Text key={label} size="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
            {t(label)}
          </Text>
        ))}
        {days.map((day) => (
          <DayCell key={day.key} day={day} />
        ))}
      </Box>
    </Box>
  );
}
