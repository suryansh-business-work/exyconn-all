/**
 * Where a CRM company or contact is on a map. A company filed from Google Places (CRM > Tools >
 * Lead generator) carries its coordinates, its Place ID and its Google Maps link; a record typed
 * in by hand has none of them and its map is found from its address in the browser instead.
 *
 * Kept apart from crm.profile.ts so the map fields can be added to both models in one spread.
 */

/** Shared by companies and contacts. `placeId` is indexed on companies only (the import dedupes on it). */
const geoFields = (indexPlaceId: boolean) => ({
  lat: { type: Number, default: null },
  lng: { type: Number, default: null },
  placeId: { type: String, default: '', trim: true, index: indexPlaceId },
  mapUrl: { type: String, default: '', trim: true },
});

export const companyGeoFields = {
  ...geoFields(true),
  /** Where the account came from, e.g. "Google Places"; empty when someone typed it in. */
  leadSource: { type: String, default: '', trim: true },
};

export const contactGeoFields = geoFields(false);

type Row = Record<string, unknown>;

/** `.lean()` rows written before these fields existed come back without them. */
const numberOrNull = (field: string) => (row: Row) => {
  const value = row[field];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
};
const text = (field: string) => (row: Row) => (row[field] as string | undefined) ?? '';

const geoResolvers = {
  lat: numberOrNull('lat'),
  lng: numberOrNull('lng'),
  placeId: text('placeId'),
  mapUrl: text('mapUrl'),
};

export const crmGeoResolvers = {
  Company: { ...geoResolvers, leadSource: text('leadSource') },
  Contact: geoResolvers,
};
