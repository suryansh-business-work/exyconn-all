import { useMemo, useState } from 'react';
import { Box } from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';
import { useSettings } from '@/hooks/useSettings';
import {
  useListUsersQuery,
  useTrackerCalendarQuery,
  useTrackerDayQuery,
} from '@/graphql/generated';
import { useTrackerMonth } from './useTrackerMonth';
import { buildTrackerMonth } from './buildTrackerMonth';
import { TrackerEmployeePicker } from './TrackerEmployeePicker';
import { TrackerView } from './TrackerView';

/** Time Tracker dashboard — pick an employee, browse their month + day activity. */
export function TrackerPage() {
  const { settings, formatDate, formatDateTime } = useSettings();
  const month = useTrackerMonth();
  const usersQuery = useListUsersQuery();
  const [employeeId, setEmployeeId] = useState<string | null>(null);

  const options = (usersQuery.data?.listUsers ?? []).map((user) => ({
    id: user.id,
    label: `${user.name} (${user.email})`,
  }));

  const calendarQuery = useTrackerCalendarQuery(
    employeeId
      ? {
          variables: {
            userId: employeeId,
            from: month.range.from,
            to: month.range.to,
            timezone: settings.timezone,
          },
        }
      : { skip: true },
  );

  const dayQuery = useTrackerDayQuery(
    employeeId && month.dayRange
      ? { variables: { userId: employeeId, ...month.dayRange } }
      : { skip: true },
  );

  const days = useMemo(
    () => buildTrackerMonth(month.month, calendarQuery.data?.trackerCalendar ?? [], new Date()),
    [month.month, calendarQuery.data],
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
        selectedDate={month.selectedDate}
        onSelectDay={month.setSelectedDate}
        day={dayQuery.data?.trackerDay}
        dayLoading={dayQuery.loading}
        dayLabel={month.selectedDate ? formatDate(month.selectedDate) : ''}
        formatDateTime={formatDateTime}
        empty={!employeeId}
      />
    </Box>
  );
}
