import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GoogleMap, MarkerF } from '@react-google-maps/api';
import { useT } from '@exyconn/i18n';
import { Alert } from '@exyconn/shell/components/ui';
import { MapSkeleton } from '../../../maps/MapSkeleton';
import { useMapsScript } from '../../../maps/mapsScript';
import type { LatLng } from '../../../maps/mapLinks';
import type { LeadPlace } from '../leadTypes';

/** The whole world, until a search gives the map something to frame. */
const WORLD_CENTRE: LatLng = { lat: 20, lng: 0 };
const WORLD_ZOOM = 2;
const FOCUS_ZOOM = 16;
const CONTAINER = { width: '100%', height: '100%' };
const MAP_OPTIONS: google.maps.MapOptions = { clickableIcons: false, streetViewControl: false };

export interface LeadMapProps {
  apiKey: string;
  places: LeadPlace[];
  focusedId: string | null;
  onFocus: (placeId: string) => void;
  onReady: () => void;
  onCentreChange: (centre: LatLng) => void;
}

/** The results as numbered markers; a marker and its row select each other. */
export default function LeadMapBody({
  apiKey,
  places,
  focusedId,
  onFocus,
  onReady,
  onCentreChange,
}: Readonly<LeadMapProps>) {
  const t = useT();
  const { isLoaded, loadError } = useMapsScript(apiKey);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  // Refit only when the set of places changes, not when a row is marked as filed.
  const framing = useMemo(() => places.map((place) => place.placeId).join(','), [places]);
  const placesRef = useRef(places);
  placesRef.current = places;

  useEffect(() => {
    const current = placesRef.current;
    if (!map || framing === '' || current.length === 0) {
      return;
    }
    const bounds = new google.maps.LatLngBounds();
    for (const place of current) {
      bounds.extend({ lat: place.lat, lng: place.lng });
    }
    map.fitBounds(bounds);
  }, [map, framing]);

  useEffect(() => {
    const place = placesRef.current.find((candidate) => candidate.placeId === focusedId);
    if (map && place) {
      map.panTo({ lat: place.lat, lng: place.lng });
      map.setZoom(Math.max(map.getZoom() ?? FOCUS_ZOOM, FOCUS_ZOOM));
    }
  }, [map, focusedId]);

  const onLoad = useCallback(
    (loaded: google.maps.Map) => {
      setMap(loaded);
      onReady();
    },
    [onReady],
  );
  const onIdle = () => {
    const centre = map?.getCenter();
    if (centre) {
      onCentreChange(centre.toJSON());
    }
  };

  if (loadError) {
    return <Alert severity="error">{t('Google Maps could not be loaded.')}</Alert>;
  }
  if (!isLoaded) {
    return <MapSkeleton height="100%" />;
  }
  return (
    <GoogleMap
      mapContainerStyle={CONTAINER}
      center={WORLD_CENTRE}
      zoom={WORLD_ZOOM}
      options={MAP_OPTIONS}
      onLoad={onLoad}
      onUnmount={() => setMap(null)}
      onIdle={onIdle}
    >
      {places.map((place, index) => (
        <MarkerF
          key={place.placeId}
          position={{ lat: place.lat, lng: place.lng }}
          title={place.name}
          label={String(index + 1)}
          zIndex={place.placeId === focusedId ? 2 : 1}
          onClick={() => onFocus(place.placeId)}
        />
      ))}
    </GoogleMap>
  );
}
