import { LeadEmailStatus, LeadImportStatus } from '@exyconn/shell/graphql/generated';
import type {
  EmailLookup,
  LeadImportPreview,
  LeadImportResult,
  LeadPlace,
} from '../../../../src/pages/lead-generator/leadTypes';

/** A Google Places business as the search returns it. */
export function leadPlace(overrides: Partial<LeadPlace> = {}): LeadPlace {
  return {
    __typename: 'LeadPlace',
    placeId: 'place-1',
    name: 'Smile Dental',
    address: '12 MG Road, Pune',
    city: 'Pune',
    country: 'India',
    phone: '+91 20 5555 0101',
    website: 'https://smile.example',
    rating: 4.6,
    ratingCount: 120,
    lat: 18.52,
    lng: 73.85,
    mapUrl: 'https://maps.example/place-1',
    primaryType: 'Dentist',
    existingCompanyId: null,
    ...overrides,
  };
}

/** A finished website lookup that found `emails`. */
export function foundLookup(emails: string[]): EmailLookup {
  return { status: LeadEmailStatus.Found, emails, message: '' };
}

/** A finished website lookup that found nothing, for `reason`. */
export function missLookup(
  reason: string,
  status: LeadEmailStatus = LeadEmailStatus.None,
): EmailLookup {
  return { status, emails: [], message: reason };
}

/** What the import preview says about one place. */
export function preview(overrides: Partial<LeadImportPreview> = {}): LeadImportPreview {
  return {
    placeId: 'place-1',
    name: 'Smile Dental',
    status: LeadImportStatus.New,
    existingCompanyId: null,
    existingName: null,
    extras: [],
    ...overrides,
  };
}

/** One "Add to CRM" call's result. */
export function importResult(overrides: Partial<LeadImportResult> = {}): LeadImportResult {
  return {
    created: 0,
    skipped: 0,
    merged: 0,
    filed: [],
    merges: [],
    skips: [],
    websitesDropped: [],
    ...overrides,
  };
}
