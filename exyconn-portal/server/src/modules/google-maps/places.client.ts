import { ConfigurationError } from '../../utils/errors';
import { GoogleMapsConfigModel } from './google-maps-config.model';
import { boundsOf, insidePolygon, type LatLngPoint } from './search-area';

/**
 * Google Places API (New) — Text Search, called from this server with the active config's server
 * key so the key never reaches a browser. Text Search covers both ways the lead generator looks:
 * "dentists in Pune" (the place is in the text), and "dentists" near the map's centre (a circle
 * the results are biased towards). Nearby Search was not used: it takes no keyword and cannot page.
 */

const SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';

/** The most Text Search returns on one page. */
export const PAGE_SIZE = 20;

/** The largest circle Places accepts for a location bias, in metres. */
export const MAX_RADIUS_METERS = 50_000;

const TIMEOUT_MS = 15_000;

/** Only the fields the lead generator shows — Places bills by the field mask. */
const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.addressComponents',
  'places.location',
  'places.nationalPhoneNumber',
  'places.internationalPhoneNumber',
  'places.websiteUri',
  'places.rating',
  'places.userRatingCount',
  'places.googleMapsUri',
  'places.types',
  'places.primaryTypeDisplayName',
  'nextPageToken',
].join(',');

export interface LeadSearchInput {
  query: string;
  /** Free text, e.g. "Pune, India". Ignored when a centre is given. */
  location?: string | null;
  lat?: number | null;
  lng?: number | null;
  radiusMeters?: number | null;
  /** An area drawn on the map: only places inside it are returned. Wins over the rest. */
  polygon?: LatLngPoint[] | null;
  /** A Places type, e.g. "dentist". */
  type?: string | null;
  pageToken?: string | null;
}

export interface LeadPlace {
  placeId: string;
  name: string;
  address: string;
  city: string;
  /** ISO 3166-1 alpha-2, as CRM companies store it. */
  country: string;
  phone: string;
  website: string;
  rating: number | null;
  ratingCount: number | null;
  lat: number;
  lng: number;
  mapUrl: string;
  types: string[];
  primaryType: string;
}

export interface LeadSearchPage {
  places: LeadPlace[];
  nextPageToken: string | null;
}

interface AddressComponent {
  longText?: string;
  shortText?: string;
  types?: string[];
}

interface PlacePayload {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  addressComponents?: AddressComponent[];
  location?: { latitude?: number; longitude?: number };
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  types?: string[];
  primaryTypeDisplayName?: { text?: string };
}

interface SearchPayload {
  places?: PlacePayload[];
  nextPageToken?: string;
}

/** The active config's server key, or a precondition error the CRM shows as "not configured". */
export async function activeServerKey(): Promise<string> {
  const config = await GoogleMapsConfigModel.findOne({ isActive: true }).lean();
  if (!config?.serverKey) {
    throw new ConfigurationError(
      'Google Places is not configured. Add a server key in Tech > Environment Variables > Google Maps.',
    );
  }
  return config.serverKey;
}

/** The first component carrying any of `types`, in its long or short form. */
function component(
  parts: AddressComponent[],
  types: readonly string[],
  form: 'longText' | 'shortText',
): string {
  const found = parts.find((part) => part.types?.some((type) => types.includes(type)));
  return found?.[form] ?? '';
}

const CITY_TYPES = ['locality', 'postal_town', 'administrative_area_level_2'] as const;

/** One Places result, flattened to what the lead list and the CRM company need. */
export function toLeadPlace(place: PlacePayload): LeadPlace | null {
  const lat = place.location?.latitude;
  const lng = place.location?.longitude;
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return null;
  }
  const parts = place.addressComponents ?? [];
  return {
    placeId: place.id,
    name: place.displayName?.text ?? '',
    address: place.formattedAddress ?? '',
    city: component(parts, CITY_TYPES, 'longText'),
    country: component(parts, ['country'], 'shortText').toUpperCase(),
    phone: place.internationalPhoneNumber ?? place.nationalPhoneNumber ?? '',
    website: place.websiteUri ?? '',
    rating: place.rating ?? null,
    ratingCount: place.userRatingCount ?? null,
    lat,
    lng,
    mapUrl: place.googleMapsUri ?? '',
    types: place.types ?? [],
    primaryType: place.primaryTypeDisplayName?.text ?? '',
  };
}

/** The Text Search body: the place goes into the text, or the centre into a location bias. */
export function searchBody(input: LeadSearchInput): Record<string, unknown> {
  if (input.polygon && input.polygon.length > 0) {
    return withPaging(input, {
      textQuery: input.query.trim(),
      pageSize: PAGE_SIZE,
      locationRestriction: { rectangle: boundsOf(input.polygon) },
    });
  }
  const hasCentre = typeof input.lat === 'number' && typeof input.lng === 'number';
  const location = input.location?.trim();
  const textQuery = !hasCentre && location ? `${input.query.trim()} in ${location}` : input.query;
  const body: Record<string, unknown> = { textQuery: textQuery.trim(), pageSize: PAGE_SIZE };
  if (hasCentre) {
    const radius = Math.min(Math.max(input.radiusMeters ?? 5000, 100), MAX_RADIUS_METERS);
    body.locationBias = {
      circle: { center: { latitude: input.lat, longitude: input.lng }, radius },
    };
  }
  return withPaging(input, body);
}

/** The type and the next-page token, which every kind of search carries the same way. */
function withPaging(input: LeadSearchInput, body: Record<string, unknown>) {
  if (input.type) {
    body.includedType = input.type;
  }
  if (input.pageToken) {
    body.pageToken = input.pageToken;
  }
  return body;
}

/** One page of Text Search with the given key. Google's own error message is kept. */
export async function searchText(apiKey: string, input: LeadSearchInput): Promise<LeadSearchPage> {
  const response = await fetch(SEARCH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify(searchBody(input)),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 300);
    throw new Error(`Google Places search failed (${response.status}): ${detail}`);
  }
  const data = (await response.json()) as SearchPayload;
  const { polygon } = input;
  const places = (data.places ?? [])
    .map(toLeadPlace)
    .filter((place): place is LeadPlace => place !== null)
    .filter((place) => !polygon?.length || insidePolygon(place, polygon));
  return { places, nextPageToken: data.nextPageToken ?? null };
}
