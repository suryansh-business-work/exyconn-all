export interface LatLng {
  lat: number;
  lng: number;
}

/** Where a record is: coordinates when known, else its address as text. */
export interface MapTarget {
  lat?: number | null;
  lng?: number | null;
  address?: string | null;
  city?: string | null;
  /** ISO country code, as CRM records store it. */
  country?: string | null;
  /** The record's own Google Maps page (from Google Places), preferred when present. */
  mapUrl?: string | null;
}

/** Coordinates when both are numbers, else null. */
export function positionOf(target: MapTarget): LatLng | null {
  if (typeof target.lat === 'number' && typeof target.lng === 'number') {
    return { lat: target.lat, lng: target.lng };
  }
  return null;
}

/** The address as one line for the Geocoder: street, city and country, whichever are known. */
export function addressText(target: MapTarget): string {
  return [target.address, target.city, target.country]
    .map((part) => part?.trim() ?? '')
    .filter(Boolean)
    .join(', ');
}

/** A Google Maps link for the target, using the documented `api=1` search URL. */
export function googleMapsLink(target: MapTarget): string {
  if (target.mapUrl) {
    return target.mapUrl;
  }
  const position = positionOf(target);
  const query = position ? `${position.lat},${position.lng}` : addressText(target);
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
