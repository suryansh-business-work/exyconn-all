import { useState } from 'react';
import { addMonths, subMonths, startOfMonth, format } from 'date-fns';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Box, Flex, Heading, Text, IconButton, Chip, CircularProgress } from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';
import { glass } from '@/components/glass/glass';
import { useListHolidaysQuery, useMyLeaveRequestsQuery } from '@/graphql/generated';
import { buildMonthDays } from './buildMonth';
import { MonthGrid } from './MonthGrid';

/** Employee self-service: a monthly calendar overlaying holidays and own leave. */
export function CalendarPage() {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));

  const holidaysQuery = useListHolidaysQuery({ fetchPolicy: 'cache-and-network' });
  const leavesQuery = useMyLeaveRequestsQuery({ fetchPolicy: 'cache-and-network' });

  const holidays = holidaysQuery.data?.listHolidays ?? [];
  const leaves = leavesQuery.data?.myLeaveRequests ?? [];
  const loading = holidaysQuery.loading || leavesQuery.loading;

  const days = buildMonthDays(month, holidays, leaves, new Date());

  return (
    <Box>
      <PageHeader title="Calendar" subtitle="Holidays and your leave at a glance" />

      <Flex direction="row" alignItems="center" spacing={1}>
        <IconButton aria-label="Previous month" onClick={() => setMonth((m) => subMonths(m, 1))}>
          <ChevronLeftIcon />
        </IconButton>
        <Heading level={5} sx={{ minWidth: 160, textAlign: 'center' }}>
          {format(month, 'MMMM yyyy')}
        </Heading>
        <IconButton aria-label="Next month" onClick={() => setMonth((m) => addMonths(m, 1))}>
          <ChevronRightIcon />
        </IconButton>
        {loading && <CircularProgress size={18} aria-label="Loading calendar" />}
      </Flex>

      <Box sx={[glass, { p: 2, mt: 2 }]}>
        <MonthGrid days={days} />
      </Box>

      <Flex direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
        <Flex direction="row" spacing={0.75} alignItems="center">
          <Box sx={{ width: 12, height: 12, borderRadius: 0.5, bgcolor: 'secondary.main' }} />
          <Text size="caption" color="text.secondary">
            Holiday
          </Text>
        </Flex>
        <Flex direction="row" spacing={0.75} alignItems="center">
          <Chip size="small" label="Leave" color="info" />
          <Text size="caption" color="text.secondary">
            Your leave
          </Text>
        </Flex>
      </Flex>
    </Box>
  );
}
