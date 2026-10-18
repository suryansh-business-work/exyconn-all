import type { LeadSearchInput } from '@exyconn/shell/graphql/generated';
import type { LatLng } from '../../maps/mapLinks';
import type { LeadSearchValues } from './forms/lead-search';

const METRES_PER_KM = 1000;

/** The form's values as the API's search: inside the drawn area, around the map centre, or in the place typed. */
export function toSearchInput(values: LeadSearchValues, centre: LatLng | null): LeadSearchInput {
  if (values.mode === 'area') {
    return { query: values.query, polygon: values.area };
  }
  if (values.mode === 'map' && centre) {
    return {
      query: values.query,
      lat: centre.lat,
      lng: centre.lng,
      radiusMeters: Math.round(values.radiusKm * METRES_PER_KM),
    };
  }
  return { query: values.query, location: values.location };
}
