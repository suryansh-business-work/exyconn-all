import type { FilterQuery } from 'mongoose';
import { badRequest } from '../../../utils/errors';
import type { LatLng } from '../../../utils/geo';
import type { CrmObject } from './crm.objects';

/**
 * "Near a location" for the CRM lists: only records whose `lat`/`lng` (crm.geo.ts) fall inside
 * a circle. A cheap latitude/longitude box narrows the rows first, then the great-circle
 * (haversine) distance is checked exactly in the query itself, so paging and totals stay right
 * and the tenant scope applies as on any other filter. Records without coordinates never match.
 */
export interface CrmNear extends LatLng {
  radiusKm: number;
}

/** The largest circle a list can be narrowed to, in kilometres. */
export const MAX_NEAR_RADIUS_KM = 500;
/** Mean Earth radius, in kilometres. */
const EARTH_RADIUS_KM = 6371;
/** How far one degree of latitude reaches. */
const KM_PER_DEGREE = (EARTH_RADIUS_KM * Math.PI) / 180;

/** Only companies and contacts carry coordinates. */
const GEO_OBJECTS: ReadonlySet<CrmObject> = new Set<CrmObject>(['COMPANY', 'CONTACT']);

const inRange = (value: number, limit: number) =>
  Number.isFinite(value) && value >= -limit && value <= limit;

function assertNear(object: CrmObject, near: CrmNear): void {
  if (!GEO_OBJECTS.has(object)) {
    badRequest('Only companies and contacts can be filtered by location');
  }
  if (!inRange(near.lat, 90)) {
    badRequest('Latitude is from -90 to 90');
  }
  if (!inRange(near.lng, 180)) {
    badRequest('Longitude is from -180 to 180');
  }
  if (!Number.isFinite(near.radiusKm) || near.radiusKm <= 0) {
    badRequest('The radius must be more than 0 km');
  }
  if (near.radiusKm > MAX_NEAR_RADIUS_KM) {
    badRequest(`The radius is at most ${MAX_NEAR_RADIUS_KM} km`);
  }
}

/** The longitudes the box spans, split in two where it crosses the 180° meridian. */
function longitudeBox(near: CrmNear, latDelta: number): FilterQuery<unknown> {
  // cos(±90°) is a tiny positive number in floating point, so the delta is huge, never NaN.
  const lngDelta = latDelta / Math.cos((near.lat * Math.PI) / 180);
  if (Math.abs(near.lat) + latDelta >= 90 || lngDelta >= 180) {
    // The circle reaches a pole or goes all the way round: any longitude can be inside it.
    return { lng: { $type: 'number' } };
  }
  const west = near.lng - lngDelta;
  const east = near.lng + lngDelta;
  if (west < -180) {
    return { $or: [{ lng: { $gte: west + 360 } }, { lng: { $lte: east } }] };
  }
  if (east > 180) {
    return { $or: [{ lng: { $gte: west } }, { lng: { $lte: east - 360 } }] };
  }
  return { lng: { $gte: west, $lte: east } };
}

const radians = (value: unknown) => ({ $degreesToRadians: value });
const sinSquaredHalf = (delta: unknown) => ({ $pow: [{ $sin: { $divide: [delta, 2] } }, 2] });

/** The record's great-circle distance from the centre, in kilometres (haversine). */
function distanceKm(near: CrmNear) {
  const lat = radians('$lat');
  const centreLat = (near.lat * Math.PI) / 180;
  const a = {
    $add: [
      sinSquaredHalf({ $subtract: [lat, centreLat] }),
      {
        $multiply: [
          Math.cos(centreLat),
          { $cos: lat },
          sinSquaredHalf({ $subtract: [radians('$lng'), (near.lng * Math.PI) / 180] }),
        ],
      },
    ],
  };
  // min(1, a) keeps rounding from taking asin out of its domain.
  return { $multiply: [2 * EARTH_RADIUS_KM, { $asin: { $sqrt: { $min: [1, a] } } }] };
}

/** The filter keeping only the records inside the circle; refuses a circle that cannot be. */
export function nearFilter(object: CrmObject, near: CrmNear): FilterQuery<unknown> {
  assertNear(object, near);
  const latDelta = near.radiusKm / KM_PER_DEGREE;
  return {
    $and: [
      {
        lat: { $gte: Math.max(near.lat - latDelta, -90), $lte: Math.min(near.lat + latDelta, 90) },
      },
      longitudeBox(near, latDelta),
      { $expr: { $lte: [distanceKm(near), near.radiusKm] } },
    ],
  };
}
