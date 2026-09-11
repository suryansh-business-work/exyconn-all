import { useMemo } from 'react';
import { Box } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { skipToken, useQuery } from '@apollo/client/react';
import {
  MyTrackerDayDocument,
  type MyTrackerDayQuery,
  type MyTrackerDayQueryVariables,
  useMyTrackerAccessQuery,
  useMyTrackerCalendarQuery,
  useTrackerProjectOptionsQuery,
} from '@exyconn/shell/graphql/generated';
import { useTrackerMonth } from '@exyconn/shell/pages/tracker-view/useTrackerMonth';
import { buildTrackerMonth } from '@exyconn/shell/pages/tracker-view/buildTrackerMonth';
import { TrackerView } from '@exyconn/shell/pages/tracker-view/TrackerView';
import { MyWorkArrangementCard } from '@exyconn/shell/components/work';
import { MyTrackerAccessBanner } from './MyTrackerAccessBanner';
import { MyOffComputerTime } from './MyOffComputerTime';

/** Employee self-view of their own tracker activity — no employee picker. */
export function MyTrackerPage() {
  const { settings, formatDate, formatTime, formatDateTime } = useSettings();
  const month = useTrackerMonth();
  const accessQuery = useMyTrackerAccessQuery();
  const calendarQuery = useMyTrackerCalendarQuery({
    variables: { from: month.range.from, to: month.range.to, timezone: settings.timezone },
  });
  const projectsQuery = useTrackerProjectOptionsQuery();
  // Apollo 4 will not skip a query with required variables through `{ skip: true }` —
  // the options still demand them. `skipToken` is its way of saying "not yet".
  const dayQuery = useQuery<MyTrackerDayQuery, MyTrackerDayQueryVariables>(
    MyTrackerDayDocument,
    month.dayRange ? { variables: month.dayRange } : skipToken,
  );

  const buckets = useMemo(() => calendarQuery.data?.myTrackerCalendar ?? [], [calendarQuery.data]);
  const days = useMemo(
    () => buildTrackerMonth(month.month, buckets, new Date()),
    [month.month, buckets],
  );

  return (
    <Box>
      <PageHeader title="My Tracker" subtitle="Your activity, transparently" />
      <MyTrackerAccessBanner
        access={accessQuery.data?.myTrackerAccess ?? null}
        formatDate={formatDate}
      />
      <MyWorkArrangementCard />
      <TrackerView
        monthLabel={month.monthLabel}
        onPrev={month.prev}
        onNext={month.next}
        loading={calendarQuery.loading}
        days={days}
        buckets={buckets}
        selectedDate={month.selectedDate}
        onSelectDay={month.setSelectedDate}
        day={dayQuery.data?.myTrackerDay}
        dayLoading={dayQuery.loading}
        dayLabel={month.selectedDate ? formatDate(month.selectedDate) : ''}
        timezone={settings.timezone}
        formatTime={formatTime}
        formatDateTime={formatDateTime}
      />
      <MyOffComputerTime
        from={month.range.from}
        to={month.range.to}
        projects={projectsQuery.data?.trackerProjectOptions ?? []}
      />
    </Box>
  );
}
