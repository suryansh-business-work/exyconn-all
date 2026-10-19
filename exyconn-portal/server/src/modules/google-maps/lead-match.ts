import type { Types } from 'mongoose';
import { CompanyModel } from '../crm/company.model';
import { escapeRegex } from '../../utils/tableQuery';
import { domainOf, locationOf, type LeadImportInput } from './lead-row';
import { phonesMatch, phoneTailPattern, toPhoneKey } from './lead-phone';

/**
 * Whether a lead is already a CRM company, and what it would add to it. A lead matches, in this
 * order, by Google Place ID, by its website's domain, by phone number, then by the exact name in
 * the same city. What it adds is only ever additive: an empty field it fills, or an email or phone
 * the company does not have yet — never a change to something already filled in.
 */

interface EmailPoint {
  address: string;
  label?: string | null;
  primary?: boolean | null;
}
interface PhonePoint {
  number: string;
  label?: string | null;
  primary?: boolean | null;
}

/** The company fields matching and merging read. */
export interface CompanyCandidate {
  _id: Types.ObjectId;
  name: string;
  domain: string;
  placeId?: string | null;
  phone?: string | null;
  phones?: PhonePoint[] | null;
  emails?: EmailPoint[] | null;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  location?: string | null;
  industry?: string | null;
  lat?: number | null;
  lng?: number | null;
  mapUrl?: string | null;
  updatedAt?: Date | null;
}

export const CANDIDATE_FIELDS =
  'name domain placeId phone phones emails website address city country location industry lat lng mapUrl updatedAt';

export type MatchKind = 'PLACE' | 'DOMAIN' | 'PHONE' | 'NAME';

export interface LeadMatch {
  company: CompanyCandidate;
  kind: MatchKind;
}

/** One additive change: `current` is what the company holds now (the existing list for emails/phones). */
export interface LeadExtra {
  field: string;
  label: string;
  current: string;
  incoming: string;
}

/** Text fields a lead may fill when the company's is empty, and the lead value for each. */
export const FILLABLE: {
  field: keyof CompanyCandidate;
  label: string;
  of: (row: LeadImportInput) => string;
}[] = [
  { field: 'website', label: 'Website', of: (row) => row.website ?? '' },
  { field: 'address', label: 'Address', of: (row) => row.address ?? '' },
  { field: 'city', label: 'City', of: (row) => row.city ?? '' },
  { field: 'country', label: 'Country', of: (row) => row.country ?? '' },
  { field: 'location', label: 'Location', of: locationOf },
  { field: 'industry', label: 'Industry', of: (row) => row.primaryType ?? '' },
  { field: 'mapUrl', label: 'Google Maps link', of: (row) => row.mapUrl ?? '' },
  { field: 'placeId', label: 'Google Place ID', of: (row) => row.placeId },
];

/** The field name the extras use for latitude and longitude together. */
export const COORDINATES = 'coordinates';

const blank = (value: unknown) =>
  value === null || value === undefined || (typeof value === 'string' && value.trim() === '');

/** A company's emails, lowercased. */
export const emailsOf = (company: CompanyCandidate): EmailPoint[] =>
  (company.emails ?? []).map((point) => ({ ...point, address: point.address.toLowerCase() }));

/** A company's phones; a row saved before the list existed shows its one phone. */
export function phonesOf(company: CompanyCandidate): PhonePoint[] {
  if (company.phones?.length) {
    return company.phones;
  }
  return company.phone ? [{ number: company.phone, label: 'Work', primary: true }] : [];
}

/** The emails a lead brings that the company lacks. */
export function newEmails(row: LeadImportInput, company: CompanyCandidate): string[] {
  const known = new Set(emailsOf(company).map((point) => point.address));
  return [...new Set(row.emails ?? [])].filter((email) => !known.has(email));
}

/** The lead's phone when no number on the company is the same one. */
export function newPhones(row: LeadImportInput, company: CompanyCandidate): string[] {
  if (!row.phone) {
    return [];
  }
  const known = phonesOf(company).map((point) => point.number);
  return known.some((number) => phonesMatch(number, row.phone ?? '')) ? [] : [row.phone];
}

/** Everything the lead would add to the company, without overwriting anything. */
export function leadExtras(row: LeadImportInput, company: CompanyCandidate): LeadExtra[] {
  const extras: LeadExtra[] = FILLABLE.filter(
    ({ field, of }) => blank(company[field]) && of(row) !== '',
  ).map(({ field, label, of }) => ({ field, label, current: '', incoming: of(row) }));
  if (blank(company.lat) && blank(company.lng)) {
    extras.push({
      field: COORDINATES,
      label: 'Map position',
      current: '',
      incoming: [row.lat, row.lng].join(', '),
    });
  }
  const emails = emailsOf(company)
    .map((point) => point.address)
    .join(', ');
  for (const email of newEmails(row, company)) {
    extras.push({ field: 'emails', label: 'Email', current: emails, incoming: email });
  }
  const phones = phonesOf(company)
    .map((point) => point.number)
    .join(', ');
  for (const phone of newPhones(row, company)) {
    extras.push({ field: 'phones', label: 'Phone', current: phones, incoming: phone });
  }
  return extras;
}

const exactly = (value: string) => new RegExp(`^${escapeRegex(value)}$`, 'i');

/** One query that finds every company any of the leads could match. */
function candidateFilter(rows: LeadImportInput[]) {
  const or: Record<string, unknown>[] = [{ placeId: { $in: rows.map((row) => row.placeId) } }];
  const domains = rows.map((row) => domainOf(row.website)).filter(Boolean);
  if (domains.length > 0) {
    or.push({ domain: { $in: domains } });
  }
  for (const row of rows) {
    const key = toPhoneKey(row.phone);
    if (key) {
      const tail = phoneTailPattern(key);
      or.push({ phone: tail }, { 'phones.number': tail });
    }
    if (row.city) {
      or.push({ name: exactly(row.name), city: exactly(row.city) });
    }
  }
  return { $or: or };
}

const sameText = (a: string | null | undefined, b: string | null | undefined) =>
  Boolean(a) && Boolean(b) && a?.trim().toLowerCase() === b?.trim().toLowerCase();

/** The first rule that matches, in order of how sure it is. */
function matchOf(row: LeadImportInput, companies: CompanyCandidate[]): LeadMatch | null {
  const domain = domainOf(row.website);
  const rules: [MatchKind, (company: CompanyCandidate) => boolean][] = [
    ['PLACE', (company) => company.placeId === row.placeId],
    ['DOMAIN', (company) => domain !== '' && company.domain === domain],
    ['PHONE', (company) => phonesOf(company).some((p) => phonesMatch(p.number, row.phone ?? ''))],
    ['NAME', (company) => sameText(company.name, row.name) && sameText(company.city, row.city)],
  ];
  for (const [kind, test] of rules) {
    const company = companies.find(test);
    if (company) {
      return { company, kind };
    }
  }
  return null;
}

/** Matches leads against the CRM; companies filed or updated during an import are remembered. */
export async function companyMatcher(rows: LeadImportInput[]) {
  const companies = await CompanyModel.find(candidateFilter(rows))
    .select(CANDIDATE_FIELDS)
    .lean<CompanyCandidate[]>();
  return {
    match: (row: LeadImportInput) => matchOf(row, companies),
    remember: (company: CompanyCandidate) => {
      const at = companies.findIndex((known) => known._id.equals(company._id));
      if (at === -1) {
        companies.push(company);
      } else {
        companies[at] = company;
      }
    },
  };
}

export type CompanyMatcher = Awaited<ReturnType<typeof companyMatcher>>;
