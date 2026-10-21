import { useMemo } from 'react';
import { Box } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import type { TypedDocumentNode } from '@apollo/client';
import { skipToken, useQuery } from '@apollo/client/react';
import {
  MyTrackerDayDocument,
  type MyTrackerDayQuery,
  type MyTrackerDayQueryVariables,
  useMyTrackerAccessQuery,
  useMyTrackerCalendarQuery,
  useMyTrackerExpectedQuery,
  useTrackerProjectOptionsQuery,
} from '@exyconn/shell/graphql/generated';
import { useTrackerMonth } from '@exyconn/shell/pages/tracker-view/useTrackerMonth';
import { buildTrackerMonth } from '@exyconn/shell/pages/tracker-view/buildTrackerMonth';
import { TrackerView } from '@exyconn/shell/pages/tracker-view/TrackerView';
import { useMonthTarget } from '@exyconn/shell/pages/tracker-view/useMonthTarget';
import { TrackerTargetSummary } from '@exyconn/shell/pages/tracker-view/TrackerTargetSummary';
import { MyHoursReportButton } from './MyHoursReportButton';
import { MyWorkArrangementCard } from '@exyconn/shell/components/work';
import { MyTrackerAccessBanner } from './MyTrackerAccessBanner';
import { MyOffComputerTime } from './MyOffComputerTime';

/** The generated document, typed so `useQuery` infers its data and variables. */
const MY_TRACKER_DAY: TypedDocumentNode<MyTrackerDayQuery, MyTrackerDayQueryVariables> =
  MyTrackerDayDocument;

/** Employee self-view of their own tracker activity — no employee picker. */
export function MyTrackerPage() {
  const { settings, formatDate, formatTime, formatDateTime } = useSettings();
  const month = useTrackerMonth();
  const accessQuery = useMyTrackerAccessQuery();
  const calendarQuery = useMyTrackerCalendarQuery({
    variables: { from: month.range.from, to: month.range.to, timezone: settings.timezone },
  });
  // The month's contract, so the calendar marks week offs, leave and holidays as HR sees them.
  const expectedQuery = useMyTrackerExpectedQuery({
    variables: { ...month.range, timezone: settings.timezone },
  });
  const projectsQuery = useTrackerProjectOptionsQuery();
  // Apollo 4 will not skip a query with required variables through `{ skip: true }` —
  // the options still demand them. `skipToken` is its way of saying "not yet".
  const dayQuery = useQuery(
    MY_TRACKER_DAY,
    month.dayRange ? { variables: month.dayRange } : skipToken,
  );

  const buckets = useMemo(() => calendarQuery.data?.myTrackerCalendar ?? [], [calendarQuery.data]);
  const days = useMemo(
    () => buildTrackerMonth(month.month, buckets, new Date()),
    [month.month, buckets],
  );
  const target = useMonthTarget(expectedQuery.data?.myTrackerExpected, buckets, settings.timezone);

  return (
    <Box>
      <PageHeader title="My Tracker" subtitle="Your activity, transparently" />
      <MyTrackerAccessBanner
        access={accessQuery.data?.myTrackerAccess ?? null}
        formatDate={formatDate}
      />
      <MyWorkArrangementCard />
      <TrackerTargetSummary
        target={target.target}
        workHoursPerDay={target.workHoursPerDay}
        workDays={target.workDays}
        loading={expectedQuery.loading}
        error={expectedQuery.error}
        actions={<MyHoursReportButton range={month.range} timezone={settings.timezone} />}
      />
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
        dayMarks={target.dayMarks}
        dayLabels={target.dayLabels}
      />
      <MyOffComputerTime
        from={month.range.from}
        to={month.range.to}
        projects={projectsQuery.data?.trackerProjectOptions ?? []}
      />
    </Box>
  );
}
