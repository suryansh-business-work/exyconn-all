import { useEffect, useState } from 'react';
import { GoogleMap, InfoWindowF, MarkerF, PolylineF } from '@react-google-maps/api';
import { useFormatters, useT } from '@exyconn/i18n';
import { Box, Text, useTheme } from '@/components/ui';
import { MapKeyRejected, MapLoadFailed, MapSkeleton } from '@/components/maps';
import { useMapsScript } from '@/components/maps/mapsScript';
import { portalLogger } from '@/logging/portalLogger';
import { KIND_LABEL, SOURCE_LABEL, type LocationPin } from './locations.types';

const CONTAINER = { width: '100%', height: '100%' };
const STREET_ZOOM = 16;
const MAP_OPTIONS: google.maps.MapOptions = { clickableIcons: false, streetViewControl: false };

export interface LocationsMapProps {
  apiKey: string;
  /** The day's pins, oldest first. */
  pins: readonly LocationPin[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

/** What a pin says when it is opened: when, why, and from what. */
function PinDetail({ pin }: Readonly<{ pin: LocationPin }>) {
  const t = useT();
  const { formatTime, formatNumber } = useFormatters();
  return (
    <Box sx={{ color: 'common.black' }}>
      <Text size="sm" weight="bold">
        {formatTime(pin.capturedAt)}
      </Text>
      <Text size="caption" component="p">
        {t(KIND_LABEL[pin.kind])} · {t(SOURCE_LABEL[pin.source])}
      </Text>
      <Text size="caption" component="p">
        {t('Within {metres} m', { metres: formatNumber(Math.round(pin.accuracyM)) })}
      </Text>
    </Box>
  );
}

/** The day on a map: numbered pins in time order joined by a line, one open at a time. */
export default function LocationsMap({
  apiKey,
  pins,
  selectedId,
  onSelect,
}: Readonly<LocationsMapProps>) {
  const theme = useTheme();
  const { isLoaded, loadError, authFailed } = useMapsScript(apiKey);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  useEffect(() => {
    if (loadError) {
      portalLogger.warn('maps: Google Maps JavaScript failed to load', loadError);
    }
  }, [loadError]);

  useEffect(() => {
    if (!map || pins.length === 0) {
      return;
    }
    if (pins.length === 1) {
      map.setCenter({ lat: pins[0].lat, lng: pins[0].lng });
      map.setZoom(STREET_ZOOM);
      return;
    }
    const bounds = new google.maps.LatLngBounds();
    for (const pin of pins) {
      bounds.extend({ lat: pin.lat, lng: pin.lng });
    }
    map.fitBounds(bounds);
  }, [map, pins]);

  if (authFailed) {
    return <MapKeyRejected />;
  }
  if (loadError) {
    return <MapLoadFailed />;
  }
  if (!isLoaded) {
    return <MapSkeleton height="100%" />;
  }
  const path = pins.map((pin) => ({ lat: pin.lat, lng: pin.lng }));
  const selected = pins.find((pin) => pin.id === selectedId);
  return (
    <GoogleMap
      mapContainerStyle={CONTAINER}
      options={MAP_OPTIONS}
      onLoad={setMap}
      onUnmount={() => setMap(null)}
    >
      <PolylineF
        path={path}
        options={{ strokeColor: theme.palette.primary.main, strokeOpacity: 0.8, strokeWeight: 3 }}
      />
      {pins.map((pin, index) => (
        <MarkerF
          key={pin.id}
          position={{ lat: pin.lat, lng: pin.lng }}
          label={String(index + 1)}
          zIndex={pin.id === selectedId ? 2 : 1}
          onClick={() => onSelect(pin.id)}
        />
      ))}
      {selected && (
        <InfoWindowF
          position={{ lat: selected.lat, lng: selected.lng }}
          onCloseClick={() => onSelect(null)}
        >
          <PinDetail pin={selected} />
        </InfoWindowF>
      )}
    </GoogleMap>
  );
}
