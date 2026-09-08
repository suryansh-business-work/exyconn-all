import { ClientModel } from '../clients/clients.model';
import { CompanyModel } from '../crm/company.model';
import { ContactModel } from '../crm/contact.model';
import type { AudienceSegment } from './audience.model';

/** Which register a member came out of. The two have different consent rules. */
export type AudienceMemberKind = 'CLIENT' | 'CONTACT';

/** One resolved recipient. Everything a send or a preview needs, and nothing else. */
export interface AudienceMember {
  id: string;
  email: string;
  name: string;
  company: string;
  /** The source row's own status — `ACTIVE`, `UNSUBSCRIBED`, … */
  status: string;
  kind: AudienceMemberKind;
}

/** The membership rules of one audience, as either the stored document or a plain object. */
export interface AudienceShape {
  clientIds?: readonly string[];
  contactIds?: readonly string[];
  dynamicSegment?: AudienceSegment | string | null;
  segmentValue?: string | null;
}

interface ClientRow {
  _id: unknown;
  name: string;
  email: string;
  company: string;
  status: string;
}

interface ContactRow {
  _id: unknown;
  name: string;
  email: string;
  companyName: string;
  status: string;
}

const clientMember = (row: ClientRow): AudienceMember => ({
  id: String(row._id),
  email: row.email,
  name: row.name,
  company: row.company,
  status: row.status,
  kind: 'CLIENT',
});

const contactMember = (row: ContactRow): AudienceMember => ({
  id: String(row._id),
  email: row.email,
  name: row.name,
  company: row.companyName,
  status: row.status,
  kind: 'CONTACT',
});

/**
 * One copy per address, first mention winning.
 *
 * The same person is routinely a client and a contact, and lands in a segment as well.
 * Mailing them three copies of one campaign is the mistake this exists to make impossible,
 * so the key is the lower-cased address rather than the row id. Pure, so the rule can be
 * tested without a database.
 */
export function dedupeMembers(members: readonly AudienceMember[]): AudienceMember[] {
  const seen = new Map<string, AudienceMember>();
  for (const member of members) {
    const key = member.email.trim().toLowerCase();
    if (key && !seen.has(key)) {
      seen.set(key, { ...member, email: key });
    }
  }
  return [...seen.values()];
}

/** The clients named individually on the audience. */
async function namedClients(ids: readonly string[]): Promise<AudienceMember[]> {
  if (ids.length === 0) {
    return [];
  }
  const rows = await ClientModel.find({ _id: { $in: ids } }).lean<ClientRow[]>();
  return rows.map(clientMember);
}

/** The CRM contacts named individually on the audience. */
async function namedContacts(ids: readonly string[]): Promise<AudienceMember[]> {
  if (ids.length === 0) {
    return [];
  }
  const rows = await ContactModel.find({ _id: { $in: ids } }).lean<ContactRow[]>();
  return rows.map(contactMember);
}

/** Contacts at every account with the given CompanyStatus. */
async function contactsByCompanyStatus(status: string): Promise<AudienceMember[]> {
  if (!status) {
    return [];
  }
  const companies = await CompanyModel.find({ status }).select('_id').lean<{ _id: unknown }[]>();
  const companyIds = companies.map((company) => String(company._id));
  if (companyIds.length === 0) {
    return [];
  }
  const rows = await ContactModel.find({
    companyId: { $in: companyIds },
    status: 'ACTIVE',
  }).lean<ContactRow[]>();
  return rows.map(contactMember);
}

/**
 * The segment's members. Only people who are still active are picked up: a rule that says
 * "everyone" must not quietly re-add the person who asked to be left alone.
 */
async function segmentMembers(audience: AudienceShape): Promise<AudienceMember[]> {
  const segment = audience.dynamicSegment ?? 'NONE';
  if (segment === 'ALL_ACTIVE_CLIENTS') {
    const rows = await ClientModel.find({ status: 'ACTIVE' }).lean<ClientRow[]>();
    return rows.map(clientMember);
  }
  if (segment === 'ALL_ACTIVE_CONTACTS') {
    const rows = await ContactModel.find({ status: 'ACTIVE' }).lean<ContactRow[]>();
    return rows.map(contactMember);
  }
  if (segment === 'CONTACTS_BY_COMPANY_STATUS') {
    return contactsByCompanyStatus(audience.segmentValue ?? '');
  }
  return [];
}

/**
 * Who an audience actually reaches, resolved in one place.
 *
 * The send, the recipient count on the page and the preview drawer all have to agree, and
 * the only way they can is by asking the same function. Named members come first so an
 * explicitly-listed person keeps their own row rather than the segment's copy of it.
 */
export async function resolveAudienceMembers(audience: AudienceShape): Promise<AudienceMember[]> {
  const [clients, contacts, segment] = await Promise.all([
    namedClients(audience.clientIds ?? []),
    namedContacts(audience.contactIds ?? []),
    segmentMembers(audience),
  ]);
  return dedupeMembers([...clients, ...contacts, ...segment]);
}
