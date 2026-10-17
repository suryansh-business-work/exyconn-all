import { badRequest } from '../../utils/errors';

/** A point as the lead generator's map draws it. */
export interface LatLngPoint {
  lat: number;
  lng: number;
}

/** A drawn area needs a triangle at least; more than this is a scribble, not an area. */
export const MIN_POLYGON_POINTS = 3;
export const MAX_POLYGON_POINTS = 50;

const isCoordinate = ({ lat, lng }: LatLngPoint) =>
  Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

/** Refuses an area the map could not have drawn. */
export function assertPolygon(points: readonly LatLngPoint[]): void {
  if (points.length < MIN_POLYGON_POINTS || points.length > MAX_POLYGON_POINTS) {
    badRequest(
      `Draw the area with ${MIN_POLYGON_POINTS} to ${MAX_POLYGON_POINTS} points on the map.`,
    );
  }
  if (!points.every(isCoordinate)) {
    badRequest('The drawn area has a point off the map.');
  }
}

/**
 * The rectangle around a drawn area, as Places Text Search takes a `locationRestriction`. Places
 * restricts only to rectangles, so the search asks for the box and {@link insidePolygon} keeps
 * what falls inside the shape.
 */
export function boundsOf(points: readonly LatLngPoint[]) {
  const lats = points.map((point) => point.lat);
  const lngs = points.map((point) => point.lng);
  return {
    low: { latitude: Math.min(...lats), longitude: Math.min(...lngs) },
    high: { latitude: Math.max(...lats), longitude: Math.max(...lngs) },
  };
}

/**
 * Whether a point lies inside the drawn area (ray casting). Treats latitude and longitude as a
 * flat plane, which is exact enough for an area a person draws around a city.
 */
export function insidePolygon(point: LatLngPoint, polygon: readonly LatLngPoint[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const a = polygon[i];
    const b = polygon[j];
    const crosses =
      a.lat > point.lat !== b.lat > point.lat &&
      point.lng < ((b.lng - a.lng) * (point.lat - a.lat)) / (b.lat - a.lat) + a.lng;
    if (crosses) {
      inside = !inside;
    }
  }
  return inside;
}
