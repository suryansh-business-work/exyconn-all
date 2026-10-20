import { useSearchParams } from 'react-router-dom';
import { isSameMonth } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { useI18n, useT } from '@exyconn/i18n';
import { Alert, Box, Button, Text } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { panel } from '@exyconn/shell/components/glass/glass';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { useCrmCalendarQuery } from '@exyconn/shell/graphql/generated';
import {
  dayKey,
  itemsByDay,
  queryRange,
  readCalendar,
  shiftAnchor,
  viewDays,
  type CalendarView,
} from './calendar.grid';
import { CalendarToolbar } from './CalendarToolbar';
import { CalendarSkeleton } from './CalendarSkeleton';
import { MonthDayCell } from './MonthDayCell';
import { AgendaColumn } from './AgendaColumn';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

/**
 * CRM › Calendar: reminders, tasks and other dated activities, and booked meetings, by month,
 * week or day. The view and the day shown live in the address; entries open their record.
 */
export function CalendarPage() {
  const t = useT();
  const { timezone } = useI18n().settings;
  const [params, setParams] = useSearchParams();
  const { view, anchor } = readCalendar(params, new Date());
  const days = viewDays(view, anchor);
  const { from, to } = queryRange(days);
  const { data, loading, error, refetch } = useCrmCalendarQuery({
    variables: { from: from.toISOString(), to: to.toISOString() },
    fetchPolicy: 'cache-and-network',
  });
  const byDay = itemsByDay(data?.crmCalendar ?? [], timezone);
  const today = formatInTimeZone(new Date(), timezone, 'yyyy-MM-dd');

  const go = (nextView: CalendarView, nextAnchor: Date) =>
    setParams({ view: nextView, date: dayKey(nextAnchor) }, { replace: true });
  const retry = () => {
    refetch().catch((reason: unknown) =>
      portalLogger.warn('crm: reloading the calendar failed', reason),
    );
  };

  const columns = view === 'month' ? 7 : days.length;
  return (
    <Box>
      <PageHeader title="Calendar" subtitle="Reminders, tasks and booked meetings" />
      <Box sx={panel}>
        <CalendarToolbar
          view={view}
          anchor={anchor}
          days={days}
          onView={(next) => go(next, anchor)}
          onStep={(step) => go(view, shiftAnchor(view, anchor, step))}
          onToday={() => go(view, new Date())}
        />
        {error && (
          <Alert
            severity="error"
            sx={{ mb: 1.5 }}
            action={
              <Button color="inherit" size="small" onClick={retry}>
                {t('Retry')}
              </Button>
            }
          >
            {errorMessage(error, t('Could not load the calendar.'))}
          </Alert>
        )}
        {!data && loading ? (
          <CalendarSkeleton />
        ) : (
          <Box
            sx={{
              display: 'grid',
              gap: 0.5,
              // A week stacks into a list of days on a phone; the month keeps its grid.
              gridTemplateColumns: {
                xs: view === 'month' ? 'repeat(7, minmax(0, 1fr))' : '1fr',
                md: `repeat(${columns}, minmax(0, 1fr))`,
              },
            }}
          >
            {view === 'month' &&
              WEEKDAYS.map((label) => (
                <Text
                  key={label}
                  size="caption"
                  color="text.secondary"
                  sx={{ textAlign: 'center' }}
                >
                  {t(label)}
                </Text>
              ))}
            {days.map((date) => {
              const key = dayKey(date);
              const items = byDay.get(key) ?? [];
              return view === 'month' ? (
                <MonthDayCell
                  key={key}
                  date={date}
                  items={items}
                  inMonth={isSameMonth(date, anchor)}
                  isToday={key === today}
                />
              ) : (
                <AgendaColumn key={key} date={date} items={items} isToday={key === today} />
              );
            })}
          </Box>
        )}
        {data && data.crmCalendar.length === 0 && (
          <Text
            component="p"
            size="sm"
            color="text.secondary"
            sx={{ mt: 1.5, textAlign: 'center' }}
          >
            {t('Nothing scheduled in this period. Add a reminder from a contact or company page.')}
          </Text>
        )}
      </Box>
    </Box>
  );
}
