import { useEffect, useMemo, useState } from 'react';
import { CircleF, useGoogleMap } from '@react-google-maps/api';
import { useTheme } from '@exyconn/shell/components/ui';
import type { LatLng } from '../../../maps/mapLinks';
import { kmToMetres } from '../../../maps/radius';
import type { SearchCircle } from '../forms/lead-search';

const FILL_OPACITY = 0.12;
const STROKE_WEIGHT = 2;

/** The map's centre, read again whenever the reader stops panning. */
function useMapCentre(map: google.maps.Map | null): LatLng | null {
  const [centre, setCentre] = useState<LatLng | null>(() => map?.getCenter()?.toJSON() ?? null);
  useEffect(() => {
    if (!map) {
      return undefined;
    }
    const listener = map.addListener('idle', () => setCentre(map.getCenter()?.toJSON() ?? null));
    return () => listener.remove();
  }, [map]);
  return centre;
}

/**
 * The radius search as a red circle: around the reader's location or typed coordinates, which
 * the map moves to, or around the map's centre, which it follows as the reader pans.
 */
export function RadiusCircle({ circle }: Readonly<{ circle: SearchCircle }>) {
  const map = useGoogleMap();
  const theme = useTheme();
  const mapCentre = useMapCentre(map);
  const colour = theme.palette.error.main;
  const point = circle.centre;
  const radius = kmToMetres(circle.radiusKm);

  useEffect(() => {
    if (map && point) {
      map.panTo(point);
    }
  }, [map, point]);

  const options = useMemo<google.maps.CircleOptions>(
    () => ({
      strokeColor: colour,
      strokeWeight: STROKE_WEIGHT,
      fillColor: colour,
      fillOpacity: FILL_OPACITY,
      clickable: false,
    }),
    [colour],
  );
  const centre = point ?? mapCentre;
  if (!centre || !Number.isFinite(radius)) {
    return null;
  }
  return <CircleF center={centre} radius={radius} options={options} />;
}
