import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useI18n, useT } from '@exyconn/i18n';
import { Box, Text, useMediaQuery, useTheme } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { panel } from '@exyconn/shell/components/glass/glass';
import { useMaCalendarQuery } from '@exyconn/shell/graphql/generated';
import { LoadError } from '../lib/LoadError';
import { meetingPaths, toMaScope, type MeetingPageProps } from '../lib/scope';
import { monthDays, monthParam, monthRange, readMonth, shiftMonth } from './calendar-month';
import {
  calendarEntries,
  entriesByDay,
  todayKey,
  type CalendarEntry,
  type CalendarEvent,
} from './calendar-entries';
import { CalendarToolbar } from './CalendarToolbar';
import { CalendarSkeleton } from './CalendarSkeleton';
import { CalendarMonthGrid } from './CalendarMonthGrid';
import { CalendarAgenda } from './CalendarAgenda';
import { CalendarEventDialog } from './CalendarEventDialog';
import { GoogleCalendarNotice } from './GoogleCalendarNotice';

/**
 * Meeting Assistant → Calendar: the month's recorded meetings and, once Google Meet is
 * connected, the viewer's own Google Calendar events with a Meet link. The month lives in the
 * address (`?month=2026-10`); a meeting opens its page, an unrecorded event its details.
 */
export function MeetingCalendarPage({ scope, basePath }: Readonly<MeetingPageProps>) {
  const t = useT();
  const { settings } = useI18n();
  const navigate = useNavigate();
  const onPhone = useMediaQuery(useTheme().breakpoints.down('sm'));
  const [params, setParams] = useSearchParams();
  const [selected, setSelected] = useState<CalendarEvent | null>(null);
  const today = todayKey(settings);
  const month = readMonth(params.get('month'), today);
  const { data, loading, error, refetch } = useMaCalendarQuery({
    variables: { ...monthRange(month), scope: toMaScope(scope) },
    fetchPolicy: 'cache-and-network',
  });
  const calendar = data?.maCalendar;
  const days = monthDays(month);
  const byDay = entriesByDay(
    calendar ? calendarEntries(calendar, t('Untitled meeting')) : [],
    settings,
  );
  const empty = Boolean(calendar) && !days.some((day) => day.inMonth && byDay.has(day.key));
  const paths = meetingPaths(basePath);

  const go = (next: Date) => setParams({ month: monthParam(next) });
  const open = (entry: CalendarEntry) => {
    if (entry.kind === 'meeting') {
      navigate(paths.detail(entry.meeting.id));
    } else {
      setSelected(entry.event);
    }
  };
  const view = { days, byDay, today, onOpen: open };

  let body;
  if (!calendar && loading) {
    body = <CalendarSkeleton />;
  } else if (onPhone) {
    body = <CalendarAgenda {...view} />;
  } else {
    body = <CalendarMonthGrid {...view} />;
  }

  return (
    <>
      <PageHeader
        title="Calendar"
        subtitle="Recorded meetings and your Google Calendar meetings, by month"
      />
      <Box sx={panel}>
        <CalendarToolbar
          month={month}
          onStep={(step) => go(shiftMonth(month, step))}
          onToday={() => go(readMonth(null, today))}
        />
        {error && (
          <Box sx={{ mb: 1.5 }}>
            <LoadError message={error.message} onRetry={() => refetch()} />
          </Box>
        )}
        {calendar && (
          <GoogleCalendarNotice google={calendar.google} googleError={calendar.googleError} />
        )}
        {empty && (
          <Text component="p" size="sm" color="text.secondary" sx={{ mt: 0, textAlign: 'center' }}>
            {t('No meetings this month')}
          </Text>
        )}
        {body}
      </Box>
      <CalendarEventDialog event={selected} onClose={() => setSelected(null)} />
    </>
  );
}
