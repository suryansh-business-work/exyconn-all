import { meteredFetch } from '../tech/usage/usage.meter';
import { isValidObjectId } from 'mongoose';
import { ROLES } from '../../constants/roles';
import { assertPermission } from '../../lib/permissions';
import { notFound } from '../../utils/errors';
import type { GraphQLContext } from '../../middleware/auth';
import { CompanyModel } from '../crm/company.model';
import { activeServerKey } from './places.client';

/**
 * A company's Google Business profile (CRM > company > Google Business), read live from Places
 * Details by the Place ID the lead generator filed it with.
 *
 * Read on demand and never stored: Google's terms allow keeping the Place ID only, so the
 * rating, reviews and hours are always the current ones.
 */

const DETAILS_URL = 'https://places.googleapis.com/v1/places';
const TIMEOUT_MS = 15_000;

/** Places bills by the field mask: only what the tab shows. */
const FIELD_MASK = [
  'id',
  'displayName',
  'formattedAddress',
  'internationalPhoneNumber',
  'websiteUri',
  'googleMapsUri',
  'rating',
  'userRatingCount',
  'reviews',
  'regularOpeningHours.weekdayDescriptions',
  'businessStatus',
  'priceLevel',
  'editorialSummary',
  'primaryTypeDisplayName',
  'types',
].join(',');

interface Text {
  text?: string;
}

interface ReviewPayload {
  name?: string;
  rating?: number;
  text?: Text;
  originalText?: Text;
  relativePublishTimeDescription?: string;
  publishTime?: string;
  authorAttribution?: { displayName?: string; uri?: string; photoUri?: string };
}

interface DetailsPayload {
  id: string;
  displayName?: Text;
  formattedAddress?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  rating?: number;
  userRatingCount?: number;
  reviews?: ReviewPayload[];
  regularOpeningHours?: { weekdayDescriptions?: string[] };
  businessStatus?: string;
  priceLevel?: string;
  editorialSummary?: Text;
  primaryTypeDisplayName?: Text;
  types?: string[];
}

const toReview = (review: ReviewPayload, index: number) => ({
  id: review.name ?? String(index),
  authorName: review.authorAttribution?.displayName ?? '',
  authorUrl: review.authorAttribution?.uri ?? '',
  authorPhotoUrl: review.authorAttribution?.photoUri ?? '',
  rating: review.rating ?? null,
  text: review.text?.text ?? review.originalText?.text ?? '',
  relativeTime: review.relativePublishTimeDescription ?? '',
  publishedAt: review.publishTime ?? null,
});

/** One place's profile, flattened to what the tab shows. */
export function toGoogleBusiness(place: DetailsPayload) {
  return {
    placeId: place.id,
    name: place.displayName?.text ?? '',
    address: place.formattedAddress ?? '',
    phone: place.internationalPhoneNumber ?? '',
    website: place.websiteUri ?? '',
    mapUrl: place.googleMapsUri ?? '',
    rating: place.rating ?? null,
    ratingCount: place.userRatingCount ?? null,
    businessStatus: place.businessStatus ?? '',
    priceLevel: place.priceLevel ?? '',
    summary: place.editorialSummary?.text ?? '',
    category: place.primaryTypeDisplayName?.text ?? '',
    types: place.types ?? [],
    openingHours: place.regularOpeningHours?.weekdayDescriptions ?? [],
    reviews: (place.reviews ?? []).map((review, index) => toReview(review, index)),
  };
}

async function fetchDetails(placeId: string): Promise<DetailsPayload> {
  const response = await meteredFetch(
    'GOOGLE_MAPS',
    'places:details',
    `${DETAILS_URL}/${encodeURIComponent(placeId)}`,
    {
      headers: { 'X-Goog-Api-Key': await activeServerKey(), 'X-Goog-FieldMask': FIELD_MASK },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    },
  );
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 300);
    throw new Error(`Google Places details failed (${response.status}): ${detail}`);
  }
  return (await response.json()) as DetailsPayload;
}

/** The company's live Google Business profile; null when it was not filed from Google Places. */
export async function companyGoogleBusiness(
  _p: unknown,
  { companyId }: { companyId: string },
  ctx: GraphQLContext,
) {
  await assertPermission(ctx, 'Company', [ROLES.CRM], 'VIEW');
  if (!isValidObjectId(companyId)) notFound('Company');
  const company = await CompanyModel.findById(companyId).select('placeId').lean();
  if (!company) notFound('Company');
  if (!company.placeId) return null;
  return toGoogleBusiness(await fetchDetails(company.placeId));
}
