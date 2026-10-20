import { verificationsFor } from '../email-verification/email-verification.service';
import { MarketingPreferenceModel } from './preference.model';
import { suppressionsAmong, withdrawnConsentReason } from './marketing.suppression';
import { emailStatusPasses, type AudienceRules } from './audience.rules';
import { UNCHECKED } from './audience.fields';
import type { SuppressionReason } from './suppression.model';
import type { EmailSelection } from './audience.model';
import type { AudienceRecord, EmailPoint } from './audience.records';

/**
 * Why an address will not be written to. The first five are compliance: no manual inclusion,
 * snapshot or rule can override them.
 */
export type ExclusionReason =
  | 'UNSUBSCRIBED'
  | 'SPAM_COMPLAINT'
  | 'CATEGORY_OPT_OUT'
  | 'BOUNCED'
  | 'BLOCKED'
  | 'INVALID_EMAIL'
  | 'LEFT_COMPANY'
  | 'MANUALLY_EXCLUDED'
  | 'EMAIL_STATUS_FILTER';

/** The compliance exclusions, which a send also writes back to the suppression list. */
export const SUPPRESSION_EXCLUSIONS: ReadonlySet<ExclusionReason> = new Set([
  'UNSUBSCRIBED',
  'SPAM_COMPLAINT',
  'BOUNCED',
  'BLOCKED',
]);

const SUPPRESSION_TO_EXCLUSION: Readonly<Record<SuppressionReason, ExclusionReason>> = {
  UNSUBSCRIBED: 'UNSUBSCRIBED',
  SPAM_COMPLAINT: 'SPAM_COMPLAINT',
  BOUNCED: 'BOUNCED',
  MANUAL: 'BLOCKED',
  DO_NOT_CONTACT: 'BLOCKED',
  OTHER: 'BLOCKED',
};

/** A contact who withdrew consent in the CRM but is not on the suppression list yet. */
export interface WithdrawnContact {
  reason: SuppressionReason;
  contactId: string;
}

/** What is known about each address, gathered once for the whole audience. */
export interface AddressFacts {
  suppressed: ReadonlyMap<string, SuppressionReason>;
  /** Addresses that turned off the campaign's preference category. */
  optedOut: ReadonlySet<string>;
  withdrawn: ReadonlyMap<string, WithdrawnContact>;
  verification: ReadonlyMap<string, string>;
  excluded: ReadonlySet<string>;
}

export const normalizeEmail = (email: string): string => email.trim().toLowerCase();

/** Every address of every contact who unsubscribed or bounced in the CRM. */
function withdrawnAddresses(contacts: readonly AudienceRecord[]): Map<string, WithdrawnContact> {
  const withdrawn = new Map<string, WithdrawnContact>();
  for (const contact of contacts) {
    const reason = withdrawnConsentReason(contact.status);
    if (reason) {
      for (const point of contact.points) {
        withdrawn.set(normalizeEmail(point.address), { reason, contactId: contact.id });
      }
    }
  }
  return withdrawn;
}

/** Suppression, verification and consent for every address, in two queries. */
export async function gatherFacts(
  addresses: readonly string[],
  contacts: readonly AudienceRecord[],
  excludedEmails: readonly string[],
  categoryId = '',
): Promise<AddressFacts> {
  const unique = [...new Set(addresses.map(normalizeEmail))];
  const [suppressed, verifications, optedOut] = await Promise.all([
    suppressionsAmong(unique),
    verificationsFor(unique),
    optedOutOf(categoryId, unique),
  ]);
  return {
    suppressed,
    optedOut,
    withdrawn: withdrawnAddresses(contacts),
    verification: new Map([...verifications].map(([email, row]) => [email, row.status])),
    excluded: new Set(excludedEmails.map(normalizeEmail)),
  };
}

/** The addresses that turned this preference category off. None when there is no category. */
async function optedOutOf(categoryId: string, emails: readonly string[]): Promise<Set<string>> {
  if (!categoryId || emails.length === 0) {
    return new Set();
  }
  const rows = await MarketingPreferenceModel.find({
    email: { $in: [...emails] },
    optedOutCategoryIds: categoryId,
  })
    .select('email')
    .lean();
  return new Set(rows.map((row) => row.email));
}

export const verificationOf = (facts: AddressFacts, email: string): string =>
  facts.verification.get(email) ?? UNCHECKED;

/** What rules out an address wherever it came from, compliance first. */
export function addressExclusion(facts: AddressFacts, email: string): ExclusionReason | null {
  const suppression = facts.suppressed.get(email);
  if (suppression) {
    return SUPPRESSION_TO_EXCLUSION[suppression];
  }
  const withdrawn = facts.withdrawn.get(email);
  if (withdrawn) {
    return SUPPRESSION_TO_EXCLUSION[withdrawn.reason];
  }
  if (facts.optedOut.has(email)) {
    return 'CATEGORY_OPT_OUT';
  }
  if (facts.verification.get(email) === 'INVALID') {
    return 'INVALID_EMAIL';
  }
  return facts.excluded.has(email) ? 'MANUALLY_EXCLUDED' : null;
}

/** One address as offered by one record, and what the rules make of it. */
export interface CandidateContext {
  facts: AddressFacts;
  rules: AudienceRules;
}

/**
 * Why this record's copy of an address is out, or null if it may be sent to. A record named
 * by hand skips the email-status rule — never the compliance checks above it.
 */
export function candidateExclusion(
  context: CandidateContext,
  email: string,
  record: Pick<AudienceRecord, 'status' | 'via'>,
): ExclusionReason | null {
  const reason = addressExclusion(context.facts, email);
  if (reason) {
    return reason;
  }
  if (record.status === 'LEFT_COMPANY') {
    return 'LEFT_COMPANY';
  }
  const status = verificationOf(context.facts, email);
  if (record.via !== 'SELECTED' && !emailStatusPasses(status, context.rules)) {
    return 'EMAIL_STATUS_FILTER';
  }
  return null;
}

const byPrimaryFirst = (a: EmailPoint, b: EmailPoint) => Number(b.primary) - Number(a.primary);

/**
 * The addresses one record contributes.
 *
 * PRIMARY is one preferred address: the primary when it may be sent to, else the next one
 * that may, else the primary anyway so the preview can say why it is out.
 */
export function selectPoints(
  record: AudienceRecord,
  selection: EmailSelection,
  emailTypes: readonly string[],
  eligible: (point: EmailPoint) => boolean,
): EmailPoint[] {
  if (selection === 'ALL') {
    return record.points;
  }
  if (selection === 'SELECTED_TYPES') {
    const types = new Set(emailTypes.map((type) => type.toLowerCase()));
    return record.points.filter((point) => types.has(point.label.toLowerCase()));
  }
  // Copy before sorting: `toSorted` is ES2023 and the server compiles against ES2021.
  const ordered = [...record.points].sort(byPrimaryFirst);
  const preferred = ordered.find(eligible) ?? ordered[0];
  return preferred ? [preferred] : [];
}
