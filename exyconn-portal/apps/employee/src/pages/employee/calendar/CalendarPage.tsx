import { useState } from 'react';
import { addMonths, subMonths, startOfMonth, format } from 'date-fns';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useT } from '@exyconn/i18n';
import {
  Box,
  Flex,
  Heading,
  Text,
  IconButton,
  Chip,
  CircularProgress,
} from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { panel } from '@exyconn/shell/components/glass/glass';
import { useMyHolidaysQuery, useMyLeaveRequestsQuery } from '@exyconn/shell/graphql/generated';
import { buildMonthDays } from './buildMonth';
import { MonthGrid } from './MonthGrid';

/** Employee self-service: a monthly calendar overlaying holidays and own leave. */
export function CalendarPage() {
  const t = useT();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));

  const holidaysQuery = useMyHolidaysQuery({ fetchPolicy: 'cache-and-network' });
  const leavesQuery = useMyLeaveRequestsQuery({ fetchPolicy: 'cache-and-network' });

  const holidays = holidaysQuery.data?.myHolidays ?? [];
  const leaves = leavesQuery.data?.myLeaveRequests ?? [];
  const loading = holidaysQuery.loading || leavesQuery.loading;

  const days = buildMonthDays(month, holidays, leaves, new Date());

  return (
    <Box>
      <PageHeader title="Calendar" subtitle="Holidays and your leave at a glance" />

      <Flex direction="row" alignItems="center" spacing={1}>
        <IconButton
          aria-label={t('Previous month')}
          onClick={() => setMonth((m) => subMonths(m, 1))}
        >
          <ChevronLeftIcon />
        </IconButton>
        <Heading level={5} sx={{ minWidth: 160, textAlign: 'center' }}>
          {format(month, 'MMMM yyyy')}
        </Heading>
        <IconButton aria-label={t('Next month')} onClick={() => setMonth((m) => addMonths(m, 1))}>
          <ChevronRightIcon />
        </IconButton>
        {loading && <CircularProgress size={18} aria-label={t('Loading calendar')} />}
      </Flex>

      <Box sx={[panel, { mt: 2 }]}>
        <MonthGrid days={days} />
      </Box>

      <Flex direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
        <Flex direction="row" spacing={1} alignItems="center">
          <Box sx={{ width: 12, height: 12, borderRadius: 0.5, bgcolor: 'secondary.main' }} />
          <Text size="caption" color="text.secondary">
            {t('Holiday')}
          </Text>
        </Flex>
        <Flex direction="row" spacing={1} alignItems="center">
          <Chip size="small" label={t('Leave')} color="info" />
          <Text size="caption" color="text.secondary">
            {t('Your leave')}
          </Text>
        </Flex>
      </Flex>
    </Box>
  );
}
