import { LeadImportStatus, type LeadImportInput } from '@exyconn/shell/graphql/generated';
import { emailsOf } from './useLeadEmails';
import type { EmailLookup, LeadImportPreview, LeadImportResult, LeadPlace } from './leadTypes';

/** The server previews and files at most this many per call. */
export const CHUNK = 100;

/** Splits a list into the server's batch size. */
export function chunksOf<T>(items: T[]): T[][] {
  const chunks: T[][] = [];
  for (let start = 0; start < items.length; start += CHUNK) {
    chunks.push(items.slice(start, start + CHUNK));
  }
  return chunks;
}

export const toInput = (place: LeadPlace, lookup: EmailLookup | undefined): LeadImportInput => ({
  placeId: place.placeId,
  name: place.name,
  phone: place.phone,
  website: place.website,
  address: place.address,
  city: place.city,
  country: place.country,
  lat: place.lat,
  lng: place.lng,
  mapUrl: place.mapUrl,
  emails: emailsOf(lookup),
  primaryType: place.primaryType,
});

/** The duplicates the person chose to update, as the import's merge list. */
export function mergeListOf(previews: LeadImportPreview[], chosen: ReadonlySet<string>) {
  return previews.flatMap((preview) =>
    preview.status === LeadImportStatus.DuplicateWithExtra &&
    preview.existingCompanyId &&
    chosen.has(preview.placeId)
      ? [{ placeId: preview.placeId, companyId: preview.existingCompanyId }]
      : [],
  );
}

export const emptyResult = (): LeadImportResult => ({
  created: 0,
  skipped: 0,
  merged: 0,
  filed: [],
  merges: [],
  skips: [],
});

/** Adds one call's result to the running total. */
export function addResult(total: LeadImportResult, part: LeadImportResult) {
  total.created += part.created;
  total.skipped += part.skipped;
  total.merged += part.merged;
  total.filed.push(...part.filed);
  total.merges.push(...part.merges);
  total.skips.push(...part.skips);
}

/** Every place now known to be in the CRM, and its company: filed, updated or skipped as a duplicate. */
export function companiesOf(result: LeadImportResult) {
  const skipped = result.skips.flatMap((skip) =>
    skip.companyId ? [{ placeId: skip.placeId, companyId: skip.companyId }] : [],
  );
  return [...result.filed, ...result.merges, ...skipped].map(({ placeId, companyId }) => ({
    placeId,
    companyId,
  }));
}
