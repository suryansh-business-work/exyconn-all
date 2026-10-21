import { lazy, Suspense, useState } from 'react';
import { useT } from '@exyconn/i18n';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import { Alert, Box, Grid } from '@/components/ui';
import { EmptyState } from '@/components/feedback/EmptyState';
import { MapKeyNotSet, MapSkeleton } from '@/components/maps';
import { useGoogleMapsClientConfigQuery } from '@/graphql/generated';
import { LocationList } from './LocationList';
import type { FormatPinTime, LocationPin } from './locations.types';

// Maps JavaScript and @react-google-maps/api download only when there are pins to show.
const LocationsMap = lazy(() => import('./LocationsMap'));

const MAP_HEIGHT = { xs: 300, md: 360 };

export interface LocationsViewProps {
  /** The pins, oldest first. */
  pins: readonly LocationPin[];
  loading: boolean;
  error?: { message: string };
  /** The English source for the empty state; translated by EmptyState. */
  emptyTitle: string;
  /** The English source for the map region's accessible name. */
  mapLabel: string;
  formatWhen: FormatPinTime;
  /** Join the pins with a line in time order (a day's route). */
  connect: boolean;
}

/** The map card for the Maps key, or the notice that stands in for it. */
function PinsMap({
  pins,
  selectedId,
  onSelect,
  formatWhen,
  connect,
}: Readonly<
  Pick<LocationsViewProps, 'pins' | 'formatWhen' | 'connect'> & {
    selectedId: string | null;
    onSelect: (id: string | null) => void;
  }
>) {
  const config = useGoogleMapsClientConfigQuery();
  const apiKey = config.data?.googleMapsClientConfig.browserKey;
  if (config.error) {
    return <Alert severity="error">{config.error.message}</Alert>;
  }
  if (apiKey) {
    return (
      <Suspense fallback={<MapSkeleton height="100%" />}>
        <LocationsMap
          apiKey={apiKey}
          pins={pins}
          selectedId={selectedId}
          onSelect={onSelect}
          formatWhen={formatWhen}
          connect={connect}
        />
      </Suspense>
    );
  }
  if (config.loading) {
    return <MapSkeleton height="100%" />;
  }
  return <MapKeyNotSet />;
}

/**
 * Location pins on a map beside a numbered list, with the loading, error and empty states.
 * Shared by the HR employee panel (one day) and Tracker > Activity (one month).
 */
export function LocationsView({
  pins,
  loading,
  error,
  emptyTitle,
  mapLabel,
  formatWhen,
  connect,
}: Readonly<LocationsViewProps>) {
  const t = useT();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (error) {
    return <Alert severity="error">{error.message}</Alert>;
  }
  if (pins.length === 0) {
    if (loading) {
      return <MapSkeleton height={MAP_HEIGHT.md} />;
    }
    return (
      <EmptyState
        icon={<PlaceOutlinedIcon />}
        title={emptyTitle}
        description="Pins appear when the employee marks attendance or moves while the tracker runs."
      />
    );
  }
  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 8 }}>
        <Box
          role="region"
          aria-label={t(mapLabel)}
          sx={{ height: MAP_HEIGHT, borderRadius: 1, overflow: 'hidden' }}
        >
          <PinsMap
            pins={pins}
            selectedId={selectedId}
            onSelect={setSelectedId}
            formatWhen={formatWhen}
            connect={connect}
          />
        </Box>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <LocationList
          pins={pins}
          selectedId={selectedId}
          onSelect={setSelectedId}
          formatWhen={formatWhen}
        />
      </Grid>
    </Grid>
  );
}
