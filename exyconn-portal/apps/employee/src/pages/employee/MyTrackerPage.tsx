import { useMemo } from 'react';
import { Box } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  useMyTrackerAccessQuery,
  useMyTrackerCalendarQuery,
  useMyTrackerDayQuery,
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
  const { settings, formatDate, formatDateTime } = useSettings();
  const month = useTrackerMonth();
  const accessQuery = useMyTrackerAccessQuery();
  const calendarQuery = useMyTrackerCalendarQuery({
    variables: { from: month.range.from, to: month.range.to, timezone: settings.timezone },
  });
  const projectsQuery = useTrackerProjectOptionsQuery();
  const dayQuery = useMyTrackerDayQuery(
    month.dayRange ? { variables: month.dayRange } : { skip: true },
  );

  const days = useMemo(
    () => buildTrackerMonth(month.month, calendarQuery.data?.myTrackerCalendar ?? [], new Date()),
    [month.month, calendarQuery.data],
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
        selectedDate={month.selectedDate}
        onSelectDay={month.setSelectedDate}
        day={dayQuery.data?.myTrackerDay}
        dayLoading={dayQuery.loading}
        dayLabel={month.selectedDate ? formatDate(month.selectedDate) : ''}
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
