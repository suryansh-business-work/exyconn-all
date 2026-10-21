import { useMemo } from 'react';
import { endOfMonth, format } from 'date-fns';
import { useFormatters, useT } from '@exyconn/i18n';
import { Box, Heading } from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';
import { useEmployeeLocationsBetweenQuery } from '@exyconn/shell/graphql/generated';
import { LocationsView } from '@exyconn/shell/pages/UserDetails/employee-locations/LocationsView';

/** The local calendar-date form the location range query takes. */
const DATE_KEY = 'yyyy-MM-dd';

interface TrackerMonthLocationsProps {
  employeeId: string;
  /** The first day of the month on screen. */
  month: Date;
}

/**
 * Tracker > Activity: every location pin the employee's tracker took in the month on screen —
 * attendance and moves, coloured apart — on one map. Follows the page's month and employee.
 */
export function TrackerMonthLocations({ employeeId, month }: Readonly<TrackerMonthLocationsProps>) {
  const t = useT();
  const { formatDateTime } = useFormatters();
  const range = useMemo(
    () => ({ from: format(month, DATE_KEY), to: format(endOfMonth(month), DATE_KEY) }),
    [month],
  );
  const { data, loading, error } = useEmployeeLocationsBetweenQuery({
    variables: { employeeId, ...range },
    fetchPolicy: 'cache-and-network',
  });

  return (
    <Box sx={[panel, { mt: 2 }]}>
      <Heading level={6} sx={{ mb: 1.5 }}>
        {t('Locations')}
      </Heading>
      <LocationsView
        pins={data?.employeeLocationsBetween ?? []}
        loading={loading}
        error={error}
        emptyTitle="No location pins this month"
        mapLabel="Map of the month’s locations"
        formatWhen={formatDateTime}
        connect={false}
      />
    </Box>
  );
}
