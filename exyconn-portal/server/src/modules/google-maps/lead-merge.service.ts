import type { Types } from 'mongoose';
import { CompanyModel } from '../crm/company.model';
import { withPrimaries } from '../crm/crm.profile';
import type { LeadImportInput } from './lead-row';
import {
  CANDIDATE_FIELDS,
  COORDINATES,
  emailsOf,
  FILLABLE,
  leadExtras,
  newEmails,
  newPhones,
  phonesOf,
  type CompanyCandidate,
  type LeadExtra,
} from './lead-match';

/**
 * Adds what a lead brings to the CRM company it duplicates: empty fields are filled and new
 * emails and phones appended, nothing already there is changed or removed. The write only lands
 * if the company is exactly as it was read (same `updatedAt`, the filled fields still empty), so a
 * colleague's edit in between is never overwritten — the merge re-reads and tries again instead.
 */

export type LeadMergeOutcome =
  | { outcome: 'MERGED'; company: CompanyCandidate; added: LeadExtra[] }
  | { outcome: 'NOTHING_NEW'; company: CompanyCandidate }
  | { outcome: 'GONE' }
  | { outcome: 'BUSY' };

/** How often a merge re-reads a company that kept changing under it before giving up. */
const ATTEMPTS = 3;

const EMPTY = { $in: ['', null] };

const filled = (added: LeadExtra[]) => new Set(added.map((extra) => extra.field));

/** The company as it was read, with every field about to be filled still empty. */
function guardOf(company: CompanyCandidate, added: LeadExtra[]) {
  const fields = filled(added);
  const guard: Record<string, unknown> = {
    _id: company._id,
    updatedAt: company.updatedAt ?? { $exists: false },
  };
  for (const { field } of FILLABLE) {
    if (fields.has(field)) {
      guard[field] = EMPTY;
    }
  }
  if (fields.has(COORDINATES)) {
    guard.lat = null;
    guard.lng = null;
  }
  return guard;
}

/** The fields to set: the empty ones the lead fills, and the lists with the new entries added. */
function changesOf(row: LeadImportInput, company: CompanyCandidate, added: LeadExtra[]) {
  const fields = filled(added);
  const set: Record<string, unknown> = {};
  for (const { field, of } of FILLABLE) {
    if (fields.has(field)) {
      set[field] = of(row);
    }
  }
  if (fields.has(COORDINATES)) {
    set.lat = row.lat;
    set.lng = row.lng;
  }
  const points = withPrimaries(
    {
      emails: [
        ...emailsOf(company),
        ...newEmails(row, company).map((address) => ({ address, label: 'Work', primary: false })),
      ],
      phones: [
        ...phonesOf(company),
        ...newPhones(row, company).map((number) => ({ number, label: 'Work', primary: false })),
      ],
    },
    false,
  );
  if (fields.has('emails')) {
    set.emails = points.emails;
  }
  if (fields.has('phones')) {
    set.phones = points.phones;
    set.phone = points.phones.find((point) => point.primary)?.number ?? '';
  }
  return set;
}

/** Merges the lead's extra details into the company; never overwrites what is filled in. */
export async function mergeLead(
  row: LeadImportInput,
  companyId: Types.ObjectId,
): Promise<LeadMergeOutcome> {
  for (let attempt = 0; attempt < ATTEMPTS; attempt += 1) {
    const company = await CompanyModel.findById(companyId)
      .select(CANDIDATE_FIELDS)
      .lean<CompanyCandidate>();
    if (!company) {
      return { outcome: 'GONE' };
    }
    const added = leadExtras(row, company);
    if (added.length === 0) {
      return { outcome: 'NOTHING_NEW', company };
    }
    const updated = await CompanyModel.findOneAndUpdate(
      guardOf(company, added),
      { $set: changesOf(row, company, added) },
      { new: true },
    )
      .select(CANDIDATE_FIELDS)
      .lean<CompanyCandidate>();
    if (updated) {
      return { outcome: 'MERGED', company: updated, added };
    }
  }
  return { outcome: 'BUSY' };
}
