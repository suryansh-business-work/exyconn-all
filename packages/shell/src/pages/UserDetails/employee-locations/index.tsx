import { useState } from 'react';
import { format } from 'date-fns';
import { useFormatters, useT } from '@exyconn/i18n';
import { Box, DatePicker, Flex, Heading } from '@/components/ui';
import { panel } from '@/components/glass/glass';
import { useEmployeeLocationsQuery } from '@/graphql/generated';
import { LocationsView } from './LocationsView';

/** HR/ADMIN panel: where the employee's tracker pinned them on one day, on a map and in a list. */
export function EmployeeLocationsPanel({ employeeId }: Readonly<{ employeeId: string }>) {
  const t = useT();
  const [day, setDay] = useState(() => new Date());
  const { formatTime } = useFormatters();
  const { data, loading, error } = useEmployeeLocationsQuery({
    variables: { employeeId, date: format(day, 'yyyy-MM-dd') },
    fetchPolicy: 'cache-and-network',
  });

  const pickDay = (value: Date | null) => {
    if (value && !Number.isNaN(value.getTime())) {
      setDay(value);
    }
  };

  return (
    <Box sx={panel}>
      <Flex
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        spacing={1}
        flexWrap="wrap"
        useFlexGap
        sx={{ mb: 1.5 }}
      >
        <Heading level={6}>{t('Locations')}</Heading>
        <DatePicker
          label={t('Day')}
          value={day}
          onChange={pickDay}
          disableFuture
          slotProps={{ textField: { size: 'small' } }}
        />
      </Flex>
      {/* Keyed by day, so picking another day closes the pin that was open. */}
      <LocationsView
        key={format(day, 'yyyy-MM-dd')}
        pins={data?.employeeLocations ?? []}
        loading={loading}
        error={error}
        emptyTitle="No locations on this day"
        mapLabel="Map of the day’s locations"
        formatWhen={formatTime}
        connect
      />
    </Box>
  );
}
