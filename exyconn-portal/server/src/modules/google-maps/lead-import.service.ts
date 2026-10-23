import { stampOrigin, type RecordOrigin } from '../crm/crm.origin';
import { isValidObjectId } from 'mongoose';
import { ActivityModel } from '../crm/activity.model';
import { CompanyModel } from '../crm/company.model';
import { withPrimaries } from '../crm/crm.profile';
import { logger } from '../../utils/logger';
import { inSequence } from '../../utils/inSequence';
import {
  companyMatcher,
  leadExtras,
  type CompanyMatcher,
  type LeadExtra,
  type LeadMatch,
} from './lead-match';
import { mergeLead } from './lead-merge.service';
import {
  checkedBatch,
  domainOf,
  locationOf,
  type CheckedLead,
  type LeadImportInput,
} from './lead-row';
import { checkWebsites, type WebsiteCheck } from './website-check';

export { domainOf, MAX_IMPORT, type LeadImportInput } from './lead-row';

/**
 * CRM > Tools > Lead generator > "Add to CRM": the chosen Google Places results become CRM
 * companies. A business already in the CRM (see lead-match.ts) is never filed twice: it is skipped,
 * or — when the user agreed in the review step — its extra details are added to the existing
 * company without changing anything already filled in. Running the same search twice is harmless.
 * A lead's website is saved only when it answers 200 OK (see website-check.ts); a lead without
 * one is filed with a blank domain, never an invented one.
 */

export const LEAD_SOURCE = 'Google Places';

export type LeadImportStatus = 'NEW' | 'DUPLICATE' | 'DUPLICATE_WITH_EXTRA';

export interface LeadImportPreview {
  placeId: string;
  name: string;
  status: LeadImportStatus;
  existingCompanyId: string | null;
  existingName: string | null;
  extras: LeadExtra[];
}

/** A lead the user agreed to merge into the company the preview matched. */
export interface LeadMergeInput {
  placeId: string;
  companyId: string;
}

export interface LeadImportSkip {
  placeId: string;
  name: string;
  reason: string;
  /** The company it duplicates, when there is one. */
  companyId: string | null;
}

export interface LeadImportFiled {
  placeId: string;
  companyId: string;
}

export interface LeadImportMerged {
  placeId: string;
  companyId: string;
  name: string;
  added: LeadExtra[];
}

/** A lead filed or merged without its website, because the site did not answer 200 OK. */
export interface LeadWebsiteDropped {
  placeId: string;
  name: string;
  website: string;
  reason: string;
}

export interface LeadImportResult {
  created: number;
  skipped: number;
  merged: number;
  filed: LeadImportFiled[];
  merges: LeadImportMerged[];
  skips: LeadImportSkip[];
  websitesDropped: LeadWebsiteDropped[];
}

/** A lead as it is saved: its website (and favicon) only when the site answered 200 OK. */
interface SavedLead {
  row: CheckedLead;
  logoUrl: string;
  /** Why its website was dropped; empty when it is kept or there was none. */
  dropped: string;
}

/** The lead with its website only when its check passed; an unchecked website is never saved. */
function savedLead(row: CheckedLead, checks: ReadonlyMap<string, WebsiteCheck>): SavedLead {
  if (!row.website) {
    return { row, logoUrl: '', dropped: '' };
  }
  const check = checks.get(row.website);
  if (check?.ok) {
    return { row, logoUrl: check.logoUrl, dropped: '' };
  }
  return { row: { ...row, website: '' }, logoUrl: '', dropped: check?.reason ?? 'Not checked' };
}

/** The company document for one place. */
function companyOf({ row, logoUrl }: SavedLead, origin: RecordOrigin) {
  const profile = withPrimaries(
    {
      emails: row.emails.map((address) => ({ address, label: 'Work' })),
      phones: row.phone ? [{ number: row.phone, label: 'Work' }] : [],
    },
    false,
  );
  return {
    ...profile,
    name: row.name,
    // Blank without a working website: a blank domain is allowed, an invented one is not.
    domain: domainOf(row.website),
    logoUrl,
    industry: row.primaryType,
    // Whoever ran the import is its lead owner, not the account's owner: nobody has taken it on.
    owner: '',
    ...stampOrigin(origin),
    website: row.website,
    address: row.address,
    city: row.city,
    country: row.country,
    location: locationOf(row),
    lat: row.lat,
    lng: row.lng,
    placeId: row.placeId,
    mapUrl: row.mapUrl,
    leadSource: LEAD_SOURCE,
  };
}

/** What each lead would do on import: be filed, be skipped, or add details to a company. */
export async function previewLeads(input: LeadImportInput[]): Promise<LeadImportPreview[]> {
  const rows = checkedBatch(input);
  const matcher = await companyMatcher(rows);
  return rows.map((row): LeadImportPreview => {
    const match = matcher.match(row);
    if (!match) {
      const fresh: LeadImportPreview = {
        placeId: row.placeId,
        name: row.name,
        status: 'NEW',
        existingCompanyId: null,
        existingName: null,
        extras: [],
      };
      return fresh;
    }
    const extras = leadExtras(row, match.company);
    return {
      placeId: row.placeId,
      name: row.name,
      status: extras.length > 0 ? 'DUPLICATE_WITH_EXTRA' : 'DUPLICATE',
      existingCompanyId: match.company._id.toHexString(),
      existingName: match.company.name,
      extras,
    };
  });
}

/** Why a duplicate was not filed, by the rule that matched it. */
function duplicateReason({ company, kind }: LeadMatch, row: CheckedLead): string {
  switch (kind) {
    case 'DOMAIN':
      return `A company with the domain ${company.domain} already exists`;
    case 'PHONE':
      return `A company with the phone number ${row.phone} already exists`;
    case 'NAME':
      return `A company named ${company.name} in ${row.city} already exists`;
    default:
      return 'Already in the CRM';
  }
}

const REVIEW_STALE = 'The CRM changed since the review. Run Add to CRM again.';
const MERGE_OUTCOME_REASONS = {
  NOTHING_NEW: 'Already in the CRM, with nothing new to add',
  GONE: 'The company was deleted during the import. Run Add to CRM again.',
  BUSY: 'The company was being edited at the same time. Run Add to CRM again.',
} as const;

/** Mongo's duplicate-key code: a parallel import filed the same domain first. */
const DUPLICATE_KEY = 11000;

/** One import call's running tally. */
class ImportRun {
  readonly result: LeadImportResult = {
    created: 0,
    skipped: 0,
    merged: 0,
    filed: [],
    merges: [],
    skips: [],
    websitesDropped: [],
  };

  constructor(
    private readonly matcher: CompanyMatcher,
    private readonly origin: RecordOrigin,
    private readonly checks: ReadonlyMap<string, WebsiteCheck>,
  ) {}

  skip(row: CheckedLead, reason: string, companyId: string | null = null) {
    this.result.skipped += 1;
    this.result.skips.push({ placeId: row.placeId, name: row.name, reason, companyId });
  }

  /** Notes that a saved lead lost its website, so the summary can say which and why. */
  private noteDropped(original: CheckedLead, { dropped }: SavedLead) {
    if (dropped) {
      this.result.websitesDropped.push({
        placeId: original.placeId,
        name: original.name,
        website: original.website,
        reason: dropped,
      });
    }
  }

  /** Files a lead that matched nothing, with a note on its timeline. */
  async create(original: CheckedLead) {
    const saved = savedLead(original, this.checks);
    const { row } = saved;
    const doc = companyOf(saved, this.origin);
    try {
      const company = await CompanyModel.create(doc);
      const id = company._id.toHexString();
      this.matcher.remember({ ...doc, _id: company._id });
      this.result.created += 1;
      this.result.filed.push({ placeId: row.placeId, companyId: id });
      this.noteDropped(original, saved);
      await ActivityModel.create({
        type: 'NOTE',
        subject: `Added from ${LEAD_SOURCE}`,
        notes: [row.address, row.mapUrl].filter(Boolean).join('\n'),
        relatedType: 'COMPANY',
        relatedId: id,
        relatedName: row.name,
        done: true,
        // An activity always names somebody: the importer's email when the account has no name.
        owner: this.origin.userName || this.origin.userEmail,
      });
    } catch (error) {
      if ((error as { code?: unknown }).code !== DUPLICATE_KEY) {
        throw error;
      }
      logger.info({ placeId: row.placeId }, 'Lead import skipped a duplicate filed in parallel');
      this.skip(row, 'Already in the CRM');
    }
  }

  /** A lead already in the CRM: merged when the user asked for it, otherwise skipped. */
  async settle(row: CheckedLead, match: LeadMatch, requested: string | undefined) {
    const companyId = match.company._id.toHexString();
    if (requested === undefined) {
      this.skip(row, duplicateReason(match, row), companyId);
      return;
    }
    if (requested !== companyId) {
      this.skip(row, REVIEW_STALE, companyId);
      return;
    }
    const saved = savedLead(row, this.checks);
    const merge = await mergeLead(saved.row, match.company._id);
    if (merge.outcome !== 'MERGED') {
      this.skip(row, MERGE_OUTCOME_REASONS[merge.outcome], companyId);
      return;
    }
    this.matcher.remember(merge.company);
    this.result.merged += 1;
    this.result.merges.push({
      placeId: row.placeId,
      companyId,
      name: merge.company.name,
      added: merge.added,
    });
    this.noteDropped(row, saved);
  }
}

/** Which company each lead the user agreed to merge goes into. */
function mergeTargets(mergeInto: LeadMergeInput[]): Map<string, string> {
  return new Map(
    mergeInto
      .filter((merge) => isValidObjectId(merge.companyId))
      .map((merge) => [merge.placeId.trim(), merge.companyId]),
  );
}

/**
 * Files the new places as companies brought in by `origin` (owned by nobody yet), adds the extra details of the duplicates
 * listed in `mergeInto`, and skips every other duplicate.
 */
export async function importLeads(
  input: LeadImportInput[],
  origin: RecordOrigin,
  mergeInto: LeadMergeInput[] = [],
): Promise<LeadImportResult> {
  const rows = checkedBatch(input);
  const targets = mergeTargets(mergeInto);
  const matcher = await companyMatcher(rows);
  // Only the websites that may be saved are visited: new leads and the merges asked for.
  const checks = await checkWebsites(
    rows.filter((row) => targets.has(row.placeId) || !matcher.match(row)).map((row) => row.website),
  );
  const run = new ImportRun(matcher, origin, checks);
  // Row after row: a company filed for one row is what a later duplicate row must match.
  await inSequence(rows, (row) => {
    const match = matcher.match(row);
    return match ? run.settle(row, match, targets.get(row.placeId)) : run.create(row);
  });
  return run.result;
}
