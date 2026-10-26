import { CompanyModel } from '../../crm/company.model';
import { ContactModel } from '../../crm/contact.model';
import { withPrimaries } from '../../crm/crm.profile';
import { stampOrigin, type RecordOrigin } from '../../crm/crm.origin';
import { companyMatcher } from '../../google-maps/lead-match';
import { domainOf, type LeadImportInput } from '../../google-maps/lead-row';
import { badRequest, notFound } from '../../../utils/errors';
import { ClutchRunModel } from './clutch.models';
import type { ClutchCompany } from './clutch.types';

export const CLUTCH_LEAD_SOURCE = 'Clutch';
const MAX_FILE = 100;

export interface ClutchImportResult {
  created: number;
  skipped: number;
  contactsCreated: number;
  skips: Array<{ key: string; name: string; reason: string; companyId: string | null }>;
  filed: Array<{ key: string; companyId: string }>;
}

/** "Atlanta, United States" → city and country, which name matching needs. */
function placeOf(company: ClutchCompany): { city: string; country: string } {
  const parts = company.headquarters
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  return { city: parts[0] ?? '', country: parts.length > 1 ? (parts.at(-1) ?? '') : '' };
}

/** A Clutch company in the shape the shared duplicate matcher reads (lead-match.ts). */
const asLead = (company: ClutchCompany): LeadImportInput => ({
  ...placeOf(company),
  placeId: `clutch:${company.key}`,
  name: company.name,
  phone: company.phone,
  website: company.website,
  lat: 0,
  lng: 0,
  emails: company.emails,
});

/** The company as the CRM files it. Only what Clutch said: nothing is guessed. */
function companyFields(company: ClutchCompany, origin: RecordOrigin) {
  const founded = Number.parseInt(company.founded, 10);
  const notes = [company.tagline, company.hourlyRate && `Hourly rate: ${company.hourlyRate}`]
    .filter(Boolean)
    .join('\n');
  return {
    ...withPrimaries(
      {
        emails: company.emails.map((address) => ({ address, label: 'Work' })),
        phone: company.phone,
      },
      false,
    ),
    name: company.name,
    domain: domainOf(company.website),
    website: company.website,
    logoUrl: company.logoUrl,
    industry: company.services[0] ?? '',
    description: company.description,
    location: company.headquarters,
    ...placeOf(company),
    foundedYear: Number.isFinite(founded) ? founded : null,
    linkedinUrl: '',
    notes: [notes, company.profileUrl && `Clutch profile: ${company.profileUrl}`]
      .filter(Boolean)
      .join('\n'),
    owner: '',
    leadSource: CLUTCH_LEAD_SOURCE,
    ...stampOrigin(origin),
  };
}

/** The people Clutch listed with an email, as contacts of the company (a contact needs one). */
async function fileContacts(company: ClutchCompany, companyId: string, origin: RecordOrigin) {
  let created = 0;
  for (const person of company.people.filter((p) => p.email)) {
    if (await ContactModel.exists({ email: person.email })) {
      continue;
    }
    await ContactModel.create({
      name: person.name,
      email: person.email,
      phone: person.phone,
      title: person.title,
      companyId,
      companyName: company.name,
      leadSource: CLUTCH_LEAD_SOURCE,
      ...stampOrigin(origin),
    });
    created += 1;
  }
  return created;
}

/**
 * Files chosen companies of a Clutch search as CRM companies, and their listed people (with an
 * email) as its contacts. A company already in the CRM — same domain, phone or name, by the
 * matcher the Google Business import uses — is skipped and named, never filed twice.
 */
export async function importClutchCompanies(
  runId: string,
  keys: readonly string[],
  origin: RecordOrigin,
): Promise<ClutchImportResult> {
  if (keys.length === 0 || keys.length > MAX_FILE) {
    badRequest(`Choose between 1 and ${MAX_FILE} companies to add.`);
  }
  const run = await ClutchRunModel.findById(runId).lean();
  if (!run) {
    notFound('Clutch search');
  }
  const chosen = new Set(keys);
  const companies = (run.companies as ClutchCompany[]).filter((c) => chosen.has(c.key));
  const matcher = await companyMatcher(companies.map(asLead));
  const result: ClutchImportResult = {
    created: 0,
    skipped: 0,
    contactsCreated: 0,
    skips: [],
    filed: [],
  };

  for (const company of companies) {
    const match = matcher.match(asLead(company));
    if (match) {
      result.skipped += 1;
      result.skips.push({
        key: company.key,
        name: company.name,
        reason: `Already in the CRM as ${match.company.name}`,
        companyId: match.company._id.toHexString(),
      });
      continue;
    }
    const row = await CompanyModel.create(companyFields(company, origin));
    matcher.remember(row.toObject());
    const companyId = String(row._id);
    result.created += 1;
    result.filed.push({ key: company.key, companyId });
    result.contactsCreated += await fileContacts(company, companyId, origin);
  }
  await ClutchRunModel.updateOne(
    { _id: runId },
    { $addToSet: { filedKeys: { $each: result.filed.map((f) => f.key) } } },
  );
  return result;
}
