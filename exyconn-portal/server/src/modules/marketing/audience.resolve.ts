import { AudienceSnapshotEmailModel } from './audience-snapshot.model';
import { AudienceListModel } from './audience.model';
import { notFound } from '../../utils/errors';
import {
  addressExclusion,
  candidateExclusion,
  gatherFacts,
  normalizeEmail,
  selectPoints,
  verificationOf,
  SUPPRESSION_EXCLUSIONS,
  type AddressFacts,
  type CandidateContext,
  type ExclusionReason,
} from './audience.eligibility';
import {
  contactsByIds,
  loadFrozenRecords,
  matchRecords,
  usesCompanyMailboxes,
  type AudienceRecord,
  type RecordKind,
  type RecordRules,
  type RecordSet,
  type RecordVia,
} from './audience.records';
import type { EmailSelection, UpdateMode } from './audience.model';

/** Everything that decides who an audience reaches — a saved one or a draft in the form. */
export interface AudienceShape extends RecordRules {
  emailSelection: EmailSelection;
  emailTypes: readonly string[];
  updateMode: UpdateMode;
  excludedEmails: readonly string[];
}

/** One record behind an address, kept on every send for attribution. */
export interface RecipientSourceRef {
  kind: RecordKind;
  id: string;
  name: string;
  via: RecordVia;
}

/** One unique address and what the audience makes of it. */
export interface ResolvedRecipient {
  email: string;
  name: string;
  company: string;
  /** The address's label on its first record — Work, Sales, Support… */
  label: string;
  /** VERIFIED / RISKY / INVALID / UNKNOWN from the verifier, or UNCHECKED. */
  verification: string;
  sources: RecipientSourceRef[];
  /** Null when it will be sent to. */
  exclusion: ExclusionReason | null;
}

export interface AudienceCounts {
  contacts: number;
  companies: number;
  clients: number;
  recordsWithoutEmail: number;
  rawEmails: number;
  duplicates: number;
  uniqueEmails: number;
  invalid: number;
  suppressed: number;
  /** Turned off the campaign's preference category. */
  optedOut: number;
  excluded: number;
  eligible: number;
}

export interface AudienceResolution {
  counts: AudienceCounts;
  recipients: ResolvedRecipient[];
  resolvedAt: Date;
}

type Candidate = Omit<ResolvedRecipient, 'verification'>;

const sourceOf = (record: AudienceRecord): RecipientSourceRef => ({
  kind: record.kind,
  id: record.id,
  name: record.name,
  via: record.via,
});

/** Each record's selected addresses, judged one by one. */
function recordCandidates(
  records: readonly AudienceRecord[],
  shape: AudienceShape,
  context: CandidateContext,
): Candidate[] {
  return records.flatMap((record) => {
    const exclusionOf = (address: string) =>
      candidateExclusion(context, normalizeEmail(address), record);
    const points = selectPoints(
      record,
      shape.emailSelection,
      shape.emailTypes,
      (point) => exclusionOf(point.address) === null,
    );
    return points.map((point) => ({
      email: normalizeEmail(point.address),
      label: point.label,
      name: record.name,
      company: record.company,
      sources: [sourceOf(record)],
      exclusion: exclusionOf(point.address),
    }));
  });
}

/**
 * One row per address, every record behind it kept. An address is sent to if any of its
 * records may send to it — compliance exclusions belong to the address, so they hold for all.
 */
function mergeByAddress(
  candidates: readonly Candidate[],
  facts: AddressFacts,
): ResolvedRecipient[] {
  const byEmail = new Map<string, ResolvedRecipient>();
  for (const candidate of candidates) {
    const existing = byEmail.get(candidate.email);
    if (existing) {
      existing.sources.push(...candidate.sources);
      if (candidate.exclusion === null) {
        existing.exclusion = null;
      }
    } else {
      byEmail.set(candidate.email, {
        ...candidate,
        sources: [...candidate.sources],
        verification: verificationOf(facts, candidate.email),
      });
    }
  }
  return [...byEmail.values()];
}

const countWhere = (
  rows: readonly ResolvedRecipient[],
  test: (row: ResolvedRecipient) => boolean,
) => rows.filter(test).length;

function countRecipients(
  records: Pick<AudienceCounts, 'contacts' | 'companies' | 'clients' | 'recordsWithoutEmail'>,
  rawEmails: number,
  recipients: readonly ResolvedRecipient[],
): AudienceCounts {
  const invalid = countWhere(recipients, (row) => row.exclusion === 'INVALID_EMAIL');
  const suppressed = countWhere(
    recipients,
    (row) => row.exclusion !== null && SUPPRESSION_EXCLUSIONS.has(row.exclusion),
  );
  const eligible = countWhere(recipients, (row) => row.exclusion === null);
  const optedOut = countWhere(recipients, (row) => row.exclusion === 'CATEGORY_OPT_OUT');
  return {
    ...records,
    rawEmails,
    duplicates: rawEmails - recipients.length,
    uniqueEmails: recipients.length,
    invalid,
    suppressed,
    optedOut,
    excluded: recipients.length - eligible - invalid - suppressed - optedOut,
    eligible,
  };
}

/** A record set's recipients: expand, judge, merge, count. */
async function resolveRecordSet(
  set: RecordSet,
  shape: AudienceShape,
  categoryId: string,
): Promise<AudienceResolution> {
  const mailboxes = usesCompanyMailboxes(shape.companyEmailSource) ? set.companies : [];
  const emitters = [...set.contacts, ...mailboxes, ...set.clients];
  const addresses = emitters.flatMap((record) => record.points.map((point) => point.address));
  const facts = await gatherFacts(addresses, set.contacts, shape.excludedEmails, categoryId);
  const candidates = recordCandidates(emitters, shape, { facts, rules: shape });
  const recipients = mergeByAddress(candidates, facts);
  const records = {
    contacts: set.contacts.length,
    companies: set.companies.length,
    clients: set.clients.length,
    recordsWithoutEmail: emitters.filter((record) => record.points.length === 0).length,
  };
  return {
    counts: countRecipients(records, candidates.length, recipients),
    recipients,
    resolvedAt: new Date(),
  };
}

const distinctIds = (sources: readonly RecipientSourceRef[], kind: RecordKind): string[] => [
  ...new Set(sources.filter((source) => source.kind === kind).map((source) => source.id)),
];

/**
 * A FIXED_SNAPSHOT audience: the frozen addresses, re-checked against today's suppression
 * list, verifier results and the consent of the contacts they were frozen from.
 */
async function resolveSnapshot(
  audienceId: string,
  shape: AudienceShape,
  categoryId: string,
): Promise<AudienceResolution> {
  const rows = await AudienceSnapshotEmailModel.find({ audienceId }).lean();
  const sources = rows.flatMap((row) => row.sources as RecipientSourceRef[]);
  const contacts = await contactsByIds(distinctIds(sources, 'CONTACT'));
  const facts = await gatherFacts(
    rows.map((row) => row.email),
    contacts,
    shape.excludedEmails,
    categoryId,
  );
  const recipients: ResolvedRecipient[] = rows.map((row) => ({
    email: row.email,
    label: row.label,
    name: row.sources[0]?.name ?? '',
    company: row.company,
    sources: row.sources as RecipientSourceRef[],
    verification: verificationOf(facts, row.email),
    exclusion: addressExclusion(facts, row.email),
  }));
  const records = {
    contacts: distinctIds(sources, 'CONTACT').length,
    companies: distinctIds(sources, 'COMPANY').length,
    clients: distinctIds(sources, 'CLIENT').length,
    recordsWithoutEmail: 0,
  };
  return {
    counts: countRecipients(records, rows.length, recipients),
    recipients,
    resolvedAt: new Date(),
  };
}

/**
 * Who an audience reaches right now — the one answer the form's counts, the preview table,
 * the send confirmation and the send itself all read.
 *
 * A draft (no id) is always resolved live: it is the preview of what saving would freeze.
 */
export async function resolveAudience(
  shape: AudienceShape,
  audienceId?: string,
  /** A campaign's preference category: addresses that turned it off are excluded. */
  categoryId = '',
): Promise<AudienceResolution> {
  if (audienceId && shape.updateMode === 'FIXED_SNAPSHOT') {
    return resolveSnapshot(audienceId, shape, categoryId);
  }
  const set =
    audienceId && shape.updateMode === 'FIXED_RECORDS'
      ? await loadFrozenRecords(audienceId)
      : await matchRecords(shape);
  return resolveRecordSet(set, shape, categoryId);
}

/** The live record set and its recipients, for freezing a fixed audience. */
export async function resolveLive(shape: AudienceShape) {
  const set = await matchRecords(shape);
  return { set, resolution: await resolveRecordSet(set, shape, '') };
}

/** A saved audience, loaded with everything resolution reads. */
export async function loadAudienceShape(id: string): Promise<AudienceShape & { name: string }> {
  const audience = await AudienceListModel.findById(id).lean();
  if (!audience) {
    notFound('Audience list');
  }
  return audience as unknown as AudienceShape & { name: string };
}
