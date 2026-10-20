import { useEffect, useMemo, useRef, useState } from 'react';
import { GoogleMap, MarkerF } from '@react-google-maps/api';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { MapKeyRejected, MapLoadFailed, MapSkeleton } from '@exyconn/shell/components/maps';
import { useMapsScript } from '@exyconn/shell/components/maps/mapsScript';
import type { LatLng } from '../../../maps/mapLinks';
import type { LeadPlace } from '../leadTypes';
import type { SearchArea } from '../useSearchArea';
import { DrawArea } from './DrawArea';

/** The whole world, until a search gives the map something to frame. */
const WORLD_CENTRE: LatLng = { lat: 20, lng: 0 };
const WORLD_ZOOM = 2;
const FOCUS_ZOOM = 16;
const CONTAINER = { width: '100%', height: '100%' };
/**
 * Centre and zoom are given once, as options when the map is created — never as props, which
 * would pull the view back on every render and fight panning to choose a centre or drawing.
 */
const MAP_OPTIONS: google.maps.MapOptions = {
  center: WORLD_CENTRE,
  zoom: WORLD_ZOOM,
  clickableIcons: false,
  streetViewControl: false,
};

export interface LeadMapProps {
  apiKey: string;
  places: LeadPlace[];
  focusedId: string | null;
  onFocus: (placeId: string) => void;
  /** True once the map works (loaded and the key accepted), false when it stops working. */
  onReadyChange: (ready: boolean) => void;
  onCentreChange: (centre: LatLng) => void;
  area: SearchArea;
  /** "Inside a drawn area" is the chosen search: show the area and take clicks as corners. */
  drawEnabled: boolean;
}

/** The results as numbered markers; a marker and its row select each other. */
export default function LeadMapBody({
  apiKey,
  places,
  focusedId,
  onFocus,
  onReadyChange,
  onCentreChange,
  area,
  drawEnabled,
}: Readonly<LeadMapProps>) {
  const { isLoaded, loadError, authFailed } = useMapsScript(apiKey);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  // Refit only when the set of places changes, not when a row is marked as filed.
  const framing = useMemo(() => places.map((place) => place.placeId).join(','), [places]);
  const placesRef = useRef(places);
  placesRef.current = places;

  useEffect(() => {
    onReadyChange(map !== null && !authFailed);
  }, [map, authFailed, onReadyChange]);

  useEffect(() => {
    if (loadError) {
      portalLogger.warn('crm: Google Maps JavaScript failed to load', loadError);
    }
  }, [loadError]);

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

  const onIdle = () => {
    const centre = map?.getCenter();
    if (centre) {
      onCentreChange(centre.toJSON());
    }
  };

  if (authFailed) {
    return <MapKeyRejected />;
  }
  if (loadError) {
    return <MapLoadFailed />;
  }
  if (!isLoaded) {
    return <MapSkeleton height="100%" />;
  }
  return (
    <GoogleMap
      mapContainerStyle={CONTAINER}
      options={MAP_OPTIONS}
      onLoad={setMap}
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
      {drawEnabled && <DrawArea area={area} />}
    </GoogleMap>
  );
}
