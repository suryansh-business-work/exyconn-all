import { lazy, Suspense, useState } from 'react';
import { format } from 'date-fns';
import { useT } from '@exyconn/i18n';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import { Alert, Box, DatePicker, Flex, Grid, Heading } from '@/components/ui';
import { EmptyState } from '@/components/feedback/EmptyState';
import { MapKeyNotSet, MapSkeleton } from '@/components/maps';
import { panel } from '@/components/glass/glass';
import { useEmployeeLocationsQuery, useGoogleMapsClientConfigQuery } from '@/graphql/generated';
import { LocationList } from './LocationList';

// Maps JavaScript and @react-google-maps/api download only when there are pins to show.
const LocationsMap = lazy(() => import('./LocationsMap'));

const MAP_HEIGHT = { xs: 300, md: 360 };

/** HR/ADMIN panel: where the employee's tracker pinned them on one day, on a map and in a list. */
export function EmployeeLocationsPanel({ employeeId }: Readonly<{ employeeId: string }>) {
  const t = useT();
  const [day, setDay] = useState(() => new Date());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data, loading, error } = useEmployeeLocationsQuery({
    variables: { employeeId, date: format(day, 'yyyy-MM-dd') },
    fetchPolicy: 'cache-and-network',
  });
  const pins = data?.employeeLocations ?? [];
  const config = useGoogleMapsClientConfigQuery({ skip: pins.length === 0 });
  const apiKey = config.data?.googleMapsClientConfig.browserKey;

  const pickDay = (value: Date | null) => {
    if (value && !Number.isNaN(value.getTime())) {
      setDay(value);
      setSelectedId(null);
    }
  };

  let body = <MapSkeleton height={MAP_HEIGHT.md} />;
  if (error) {
    body = <Alert severity="error">{error.message}</Alert>;
  } else if (!loading && pins.length === 0) {
    body = (
      <EmptyState
        icon={<PlaceOutlinedIcon />}
        title="No locations on this day"
        description="Pins appear when the employee marks attendance or moves while the tracker runs."
      />
    );
  } else if (pins.length > 0) {
    let map = <MapSkeleton height="100%" />;
    if (apiKey) {
      map = (
        <Suspense fallback={<MapSkeleton height="100%" />}>
          <LocationsMap
            apiKey={apiKey}
            pins={pins}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </Suspense>
      );
    } else if (!config.loading) {
      map = <MapKeyNotSet />;
    }
    body = (
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Box
            role="region"
            aria-label={t('Map of the day’s locations')}
            sx={{ height: MAP_HEIGHT, borderRadius: 1, overflow: 'hidden' }}
          >
            {map}
          </Box>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <LocationList pins={pins} selectedId={selectedId} onSelect={setSelectedId} />
        </Grid>
      </Grid>
    );
  }

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
      {body}
    </Box>
  );
}
