import { createHash } from 'node:crypto';
import { isEmailAddress } from '../../utils/emailAddress';
import { badRequest } from '../../utils/errors';

/**
 * One Google Places result as the lead generator sends it, and the checks every lead passes
 * before it is matched against the CRM or filed (see lead-import.service.ts and lead-match.ts).
 */

export interface LeadImportInput {
  placeId: string;
  name: string;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  lat: number;
  lng: number;
  mapUrl?: string | null;
  emails?: string[] | null;
  primaryType?: string | null;
}

/** The registrable host of a website, without www. — what a CRM company's `domain` holds. */
export function domainOf(website: string | null | undefined): string {
  if (!website) {
    return '';
  }
  try {
    const url = new URL(website);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      return '';
    }
    return url.hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
}

/**
 * A company must have a unique domain. A business with no website gets a reserved `.invalid`
 * one (RFC 2606: never resolves) made from its name and Place ID, so it can still be filed and
 * its real domain typed in later.
 */
export function placeholderDomain(name: string, placeId: string): string {
  const slug = name
    .toLowerCase()
    .normalize('NFKD')
    .replaceAll(/\p{M}/gu, '')
    .replaceAll(/[^a-z\d]+/g, '-')
    .replaceAll(/^-|-$/g, '')
    .slice(0, 40);
  const hash = createHash('sha1').update(placeId).digest('hex').slice(0, 8);
  return `${slug || 'place'}-${hash}.no-website.invalid`;
}

/** Only Google's own Maps links are stored as a map URL. */
function safeMapUrl(value: string | null | undefined): string {
  if (!value) {
    return '';
  }
  try {
    const url = new URL(value);
    const google = url.hostname === 'maps.google.com' || url.hostname.endsWith('.google.com');
    return url.protocol === 'https:' && google ? url.toString() : '';
  } catch {
    return '';
  }
}

const clip = (value: string | null | undefined, max: number) => (value ?? '').trim().slice(0, max);

/** Refuses a row that is not a place at all; trims everything else to sane lengths. */
export function checkedRow(row: LeadImportInput): LeadImportInput {
  const placeId = clip(row.placeId, 300);
  const name = clip(row.name, 200);
  const latOk = Number.isFinite(row.lat) && Math.abs(row.lat) <= 90;
  const lngOk = Number.isFinite(row.lng) && Math.abs(row.lng) <= 180;
  if (!placeId || !name || !latOk || !lngOk) {
    badRequest('Each lead needs a Place ID, a name and valid coordinates.');
  }
  return {
    placeId,
    name,
    phone: clip(row.phone, 40),
    website: domainOf(row.website) ? clip(row.website, 500) : '',
    address: clip(row.address, 500),
    city: clip(row.city, 120),
    country: clip(row.country, 2).toUpperCase(),
    lat: row.lat,
    lng: row.lng,
    mapUrl: safeMapUrl(row.mapUrl),
    emails: (row.emails ?? []).map((email) => email.trim().toLowerCase()).filter(isEmailAddress),
    primaryType: clip(row.primaryType, 120),
  };
}

/** The most leads one preview or import call takes. */
export const MAX_IMPORT = 100;

/** Every lead of a preview or import call, checked; refuses an empty or oversized batch. */
export function checkedBatch(input: LeadImportInput[]): LeadImportInput[] {
  if (input.length === 0 || input.length > MAX_IMPORT) {
    badRequest(`Add between 1 and ${MAX_IMPORT} leads at a time.`);
  }
  return input.map(checkedRow);
}

/** The text a company's `location` holds: city and country. */
export const locationOf = (row: LeadImportInput) =>
  [row.city, row.country].filter(Boolean).join(', ');
