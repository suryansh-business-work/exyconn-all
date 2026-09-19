import { useState } from 'react';
import { addMonths, format, startOfMonth, subMonths } from 'date-fns';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useT } from '@exyconn/i18n';
import {
  Box,
  CircularProgress,
  Flex,
  Grid,
  Heading,
  IconButton,
  Text,
} from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';
import { useMyHolidaysQuery, useMyLeaveRequestsQuery } from '@exyconn/shell/graphql/generated';
import { buildAttendanceMonth, type AttendanceInput } from './attendanceDays';
import { AttendanceDayCell } from './AttendanceDayCell';
import { AttendanceLegend } from './AttendanceLegend';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

interface AttendanceCalendarProps {
  /** The employee's attendance, already loaded by the page. */
  attendance: readonly AttendanceInput[];
  attendanceLoading: boolean;
}

/** A month of the employee's attendance, leave and holidays, with a legend beside it. */
export function AttendanceCalendar({
  attendance,
  attendanceLoading,
}: Readonly<AttendanceCalendarProps>) {
  const t = useT();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const leaves = useMyLeaveRequestsQuery({ fetchPolicy: 'cache-and-network' });
  const holidays = useMyHolidaysQuery({ fetchPolicy: 'cache-and-network' });
  const loading = attendanceLoading || leaves.loading || holidays.loading;
  const error = leaves.error ?? holidays.error;

  const days = buildAttendanceMonth(
    month,
    attendance,
    leaves.data?.myLeaveRequests ?? [],
    holidays.data?.myHolidays ?? [],
    new Date(),
  );

  return (
    <Grid container spacing={2} sx={{ mb: 2 }}>
      <Grid size={{ xs: 12, md: 8 }}>
        <Box sx={panel}>
          <Flex direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
            <IconButton
              aria-label={t('Previous month')}
              onClick={() => setMonth((m) => subMonths(m, 1))}
            >
              <ChevronLeftIcon />
            </IconButton>
            <Heading level={6} sx={{ minWidth: 150, textAlign: 'center' }}>
              {format(month, 'MMMM yyyy')}
            </Heading>
            <IconButton
              aria-label={t('Next month')}
              onClick={() => setMonth((m) => addMonths(m, 1))}
            >
              <ChevronRightIcon />
            </IconButton>
            {loading && <CircularProgress size={18} aria-label={t('Loading calendar')} />}
          </Flex>
          {error && <Text color="error">{error.message}</Text>}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 0.5 }}>
            {WEEKDAYS.map((label) => (
              <Text key={label} size="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                {t(label)}
              </Text>
            ))}
            {days.map((day) => (
              <AttendanceDayCell key={day.key} day={day} />
            ))}
          </Box>
        </Box>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <AttendanceLegend />
      </Grid>
    </Grid>
  );
}
