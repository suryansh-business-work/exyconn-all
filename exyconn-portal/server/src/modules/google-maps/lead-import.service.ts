import { createHash } from 'node:crypto';
import { ActivityModel } from '../crm/activity.model';
import { CompanyModel } from '../crm/company.model';
import { withPrimaries } from '../crm/crm.profile';
import { isEmailAddress } from '../../utils/emailAddress';
import { badRequest } from '../../utils/errors';
import { logger } from '../../utils/logger';

/**
 * CRM > Tools > Lead generator > "Add to CRM": the chosen Google Places results become CRM
 * companies. A place already filed (same Place ID), or a business whose website domain is already
 * an account, is skipped rather than duplicated — so running the same search twice is harmless.
 */

export const LEAD_SOURCE = 'Google Places';
export const MAX_IMPORT = 100;

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

export interface LeadImportSkip {
  placeId: string;
  name: string;
  reason: string;
}

export interface LeadImportFiled {
  placeId: string;
  companyId: string;
}

export interface LeadImportResult {
  created: number;
  skipped: number;
  filed: LeadImportFiled[];
  skips: LeadImportSkip[];
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
function checkedRow(row: LeadImportInput): LeadImportInput {
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

/** The company document for one place. */
function companyOf(row: LeadImportInput, domain: string, owner: string) {
  const profile = withPrimaries(
    {
      emails: (row.emails ?? []).map((address) => ({ address, label: 'Work' })),
      phones: row.phone ? [{ number: row.phone, label: 'Work' }] : [],
    },
    false,
  );
  return {
    ...profile,
    name: row.name,
    domain,
    industry: row.primaryType ?? '',
    owner,
    website: row.website ?? '',
    address: row.address ?? '',
    city: row.city ?? '',
    country: row.country ?? '',
    location: [row.city, row.country].filter(Boolean).join(', '),
    lat: row.lat,
    lng: row.lng,
    placeId: row.placeId,
    mapUrl: row.mapUrl ?? '',
    leadSource: LEAD_SOURCE,
  };
}

/** Which of these places and domains are already accounts. */
async function existing(rows: { placeId: string; domain: string }[]) {
  const found = await CompanyModel.find({
    $or: [
      { placeId: { $in: rows.map((row) => row.placeId) } },
      { domain: { $in: rows.map((row) => row.domain) } },
    ],
  })
    .select('placeId domain')
    .lean();
  return {
    placeIds: new Set(found.map((company) => company.placeId).filter(Boolean)),
    domains: new Set(found.map((company) => company.domain)),
  };
}

/** Mongo's duplicate-key code: a parallel import filed the same domain first. */
const DUPLICATE_KEY = 11000;

/** Files the places as companies, owned by `owner`, each with a note on its timeline. */
export async function importLeads(
  input: LeadImportInput[],
  owner: string,
): Promise<LeadImportResult> {
  if (input.length === 0 || input.length > MAX_IMPORT) {
    badRequest(`Add between 1 and ${MAX_IMPORT} leads at a time.`);
  }
  const rows = input.map(checkedRow).map((row) => ({
    row,
    domain: domainOf(row.website) || placeholderDomain(row.name, row.placeId),
  }));
  const known = await existing(rows.map(({ row, domain }) => ({ placeId: row.placeId, domain })));
  const result: LeadImportResult = { created: 0, skipped: 0, filed: [], skips: [] };
  const skip = (row: LeadImportInput, reason: string) => {
    result.skipped += 1;
    result.skips.push({ placeId: row.placeId, name: row.name, reason });
  };

  for (const { row, domain } of rows) {
    if (known.placeIds.has(row.placeId)) {
      skip(row, 'Already in the CRM');
      continue;
    }
    if (known.domains.has(domain)) {
      skip(row, `A company with the domain ${domain} already exists`);
      continue;
    }
    try {
      const company = await CompanyModel.create(companyOf(row, domain, owner));
      const id = company._id.toHexString();
      known.placeIds.add(row.placeId);
      known.domains.add(domain);
      result.created += 1;
      result.filed.push({ placeId: row.placeId, companyId: id });
      await ActivityModel.create({
        type: 'NOTE',
        subject: `Added from ${LEAD_SOURCE}`,
        notes: [row.address, row.mapUrl].filter(Boolean).join('\n'),
        relatedType: 'COMPANY',
        relatedId: id,
        relatedName: row.name,
        done: true,
        owner,
      });
    } catch (error) {
      if ((error as { code?: unknown }).code !== DUPLICATE_KEY) {
        throw error;
      }
      logger.info({ placeId: row.placeId }, 'Lead import skipped a duplicate filed in parallel');
      skip(row, 'Already in the CRM');
    }
  }
  return result;
}
