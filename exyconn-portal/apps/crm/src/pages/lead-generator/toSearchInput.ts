import type { LeadSearchInput } from '@exyconn/shell/graphql/generated';
import type { LatLng } from '../../maps/mapLinks';
import type { LeadSearchValues } from './forms/lead-search';

const METRES_PER_KM = 1000;

/** The form's values as the API's search: around the map centre, or in the place typed. */
export function toSearchInput(values: LeadSearchValues, centre: LatLng | null): LeadSearchInput {
  const type = values.type === '' ? null : values.type;
  if (values.aroundMap && centre) {
    return {
      query: values.query,
      lat: centre.lat,
      lng: centre.lng,
      radiusMeters: Math.round(values.radiusKm * METRES_PER_KM),
      type,
    };
  }
  return { query: values.query, location: values.location, type };
}
