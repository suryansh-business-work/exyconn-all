import type {
  FindLeadEmailsMutation,
  ImportLeadsToCrmMutation,
  LeadPlaceFieldsFragment,
} from '@exyconn/shell/graphql/generated';

export type LeadPlace = LeadPlaceFieldsFragment;
export type LeadImportResult = ImportLeadsToCrmMutation['importLeadsToCrm'];

/** A website lookup that is still running, or what it found. */
export type EmailLookup = { status: 'PENDING' } | FindLeadEmailsMutation['findLeadEmails'];

/**
 * Google Places types offered in the search form (a subset of Google's own list). Places API
 * values, not business data: the label is the English source string translated on screen.
 */
export const PLACE_TYPES: ReadonlyArray<{ value: string; label: string }> = [
  { value: '', label: 'Any type' },
  { value: 'accounting', label: 'Accountants' },
  { value: 'restaurant', label: 'Restaurants' },
  { value: 'cafe', label: 'Cafés' },
  { value: 'hotel', label: 'Hotels' },
  { value: 'dentist', label: 'Dentists' },
  { value: 'doctor', label: 'Doctors' },
  { value: 'hospital', label: 'Hospitals' },
  { value: 'pharmacy', label: 'Pharmacies' },
  { value: 'gym', label: 'Gyms' },
  { value: 'beauty_salon', label: 'Beauty salons' },
  { value: 'lawyer', label: 'Lawyers' },
  { value: 'insurance_agency', label: 'Insurance agencies' },
  { value: 'real_estate_agency', label: 'Real estate agencies' },
  { value: 'car_repair', label: 'Car repair' },
  { value: 'electrician', label: 'Electricians' },
  { value: 'plumber', label: 'Plumbers' },
  { value: 'school', label: 'Schools' },
  { value: 'store', label: 'Shops' },
];
