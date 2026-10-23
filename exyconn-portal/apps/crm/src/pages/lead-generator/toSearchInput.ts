import type { LeadSearchInput } from '@exyconn/shell/graphql/generated';
import type { LatLng } from '../../maps/mapLinks';
import { kmToMetres } from '../../maps/radius';
import { pointOf, type LeadSearchValues } from './forms/lead-search';

/**
 * The form's values as the API's search: inside the drawn area, around a point (the reader's,
 * typed coordinates, or else the map centre), or in the place typed.
 */
export function toSearchInput(values: LeadSearchValues, centre: LatLng | null): LeadSearchInput {
  if (values.mode === 'area') {
    return { query: values.query, polygon: values.area };
  }
  const point = values.mode === 'map' ? (pointOf(values) ?? centre) : null;
  if (point) {
    return {
      query: values.query,
      lat: point.lat,
      lng: point.lng,
      radiusMeters: kmToMetres(values.radiusKm),
    };
  }
  return { query: values.query, location: values.location };
}
