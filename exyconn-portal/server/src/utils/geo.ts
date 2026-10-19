const EARTH_RADIUS_METRES = 6_371_000;

/** A point on the globe, in degrees. */
export interface LatLng {
  lat: number;
  lng: number;
}

const radians = (degrees: number): number => (degrees * Math.PI) / 180;

/**
 * The great-circle (haversine) distance between two points, in metres. Accurate to well under
 * a metre at the few-hundred-metre scale a "did they move" check is made at.
 */
export function distanceMetres(a: LatLng, b: LatLng): number {
  const dLat = radians(b.lat - a.lat);
  const dLng = radians(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(a.lat)) * Math.cos(radians(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METRES * Math.asin(Math.min(1, Math.sqrt(h)));
}
