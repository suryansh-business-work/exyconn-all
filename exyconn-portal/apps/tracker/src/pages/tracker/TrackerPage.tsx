import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { withParam } from '@exyconn/shell/utils/searchParams';
import { skipToken, useQuery } from '@apollo/client/react';
import {
  TrackerCalendarDocument,
  TrackerDayDocument,
  type TrackerCalendarQuery,
  type TrackerCalendarQueryVariables,
  type TrackerDayQuery,
  type TrackerDayQueryVariables,
  useListEmployeeOptionsQuery,
} from '@exyconn/shell/graphql/generated';
import { useTrackerMonth } from '@exyconn/shell/pages/tracker-view/useTrackerMonth';
import { buildTrackerMonth } from '@exyconn/shell/pages/tracker-view/buildTrackerMonth';
import { TrackerEmployeePicker } from './TrackerEmployeePicker';
import { TrackerView } from '@exyconn/shell/pages/tracker-view/TrackerView';

/** Query-string key holding whose tracker is on screen. */
const EMPLOYEE_PARAM = 'employee';

/**
 * Time Tracker dashboard — pick an employee, browse their month + day activity.
 * Employee, month and day all live in the URL (`/tracker?employee=<userId>
 * &month=YYYY-MM&date=YYYY-MM-DD`) so a view can be shared, bookmarked and refreshed.
 */
export function TrackerPage() {
  const { settings, formatDate, formatTime, formatDateTime } = useSettings();
  const month = useTrackerMonth();
  const usersQuery = useListEmployeeOptionsQuery();
  const [searchParams, setSearchParams] = useSearchParams();
  const employeeId = searchParams.get(EMPLOYEE_PARAM);

  const setEmployeeId = useCallback(
    (id: string | null) => {
      setSearchParams((current) => withParam(current, EMPLOYEE_PARAM, id), { replace: true });
    },
    [setSearchParams],
  );

  const options = (usersQuery.data?.listEmployeeOptions ?? []).map((user) => ({
    id: user.id,
    label: `${user.name} (${user.email})`,
  }));

  // Apollo 4 will not skip a query with required variables through `{ skip: true }` —
  // the options still demand them. `skipToken` is its way of saying "not yet".
  const calendarQuery = useQuery<TrackerCalendarQuery, TrackerCalendarQueryVariables>(
    TrackerCalendarDocument,
    employeeId
      ? {
          variables: {
            userId: employeeId,
            from: month.range.from,
            to: month.range.to,
            timezone: settings.timezone,
          },
        }
      : skipToken,
  );

  const dayQuery = useQuery<TrackerDayQuery, TrackerDayQueryVariables>(
    TrackerDayDocument,
    employeeId && month.dayRange
      ? { variables: { userId: employeeId, ...month.dayRange } }
      : skipToken,
  );

  const buckets = useMemo(() => calendarQuery.data?.trackerCalendar ?? [], [calendarQuery.data]);
  const days = useMemo(
    () => buildTrackerMonth(month.month, buckets, new Date()),
    [month.month, buckets],
  );

  return (
    <Box>
      <PageHeader title="Time Tracker" subtitle="Worked hours, activity & screenshots">
        <TrackerEmployeePicker options={options} value={employeeId} onChange={setEmployeeId} />
      </PageHeader>
      <TrackerView
        monthLabel={month.monthLabel}
        onPrev={month.prev}
        onNext={month.next}
        loading={calendarQuery.loading}
        days={days}
        buckets={buckets}
        selectedDate={month.selectedDate}
        onSelectDay={month.setSelectedDate}
        day={dayQuery.data?.trackerDay}
        dayLoading={dayQuery.loading}
        dayLabel={month.selectedDate ? formatDate(month.selectedDate) : ''}
        timezone={settings.timezone}
        formatTime={formatTime}
        formatDateTime={formatDateTime}
        empty={!employeeId}
      />
    </Box>
  );
}
