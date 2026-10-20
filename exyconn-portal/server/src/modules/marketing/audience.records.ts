import { ClientModel } from '../clients/clients.model';
import { CompanyModel } from '../crm/company.model';
import { ContactModel } from '../crm/contact.model';
import { AudienceSnapshotRecordModel } from './audience-snapshot.model';
import { rulesFilter, type AudienceRules } from './audience.rules';
import type { CompanyEmailSource, RecipientSource } from './audience.model';

export type RecordKind = 'CONTACT' | 'COMPANY' | 'CLIENT';
export type RecordVia = 'RULES' | 'LINKED_CONTACT' | 'SELECTED';

/** One of a record's addresses, as the CRM stores it. */
export interface EmailPoint {
  address: string;
  label: string;
  primary: boolean;
}

/** A matched CRM record, reduced to what recipient resolution reads. */
export interface AudienceRecord {
  kind: RecordKind;
  id: string;
  name: string;
  company: string;
  /** The record's own status — a contact's ACTIVE / UNSUBSCRIBED / … */
  status: string;
  via: RecordVia;
  points: EmailPoint[];
}

/** Every record an audience matched, by register. */
export interface RecordSet {
  contacts: AudienceRecord[];
  companies: AudienceRecord[];
  clients: AudienceRecord[];
}

/** The parts of an audience that decide which records it matches. */
export interface RecordRules extends AudienceRules {
  recipientSource: RecipientSource;
  companyEmailSource: CompanyEmailSource;
  clientIds: readonly string[];
  contactIds: readonly string[];
  companyIds: readonly string[];
  allActiveClients: boolean;
}

interface StoredRow {
  _id: unknown;
  name: string;
  email?: string | null;
  emails?: { address: string; label?: string | null; primary?: boolean | null }[] | null;
  status: string;
  companyName?: string | null;
  company?: string | null;
}

const CONTACT_FIELDS = 'name email emails companyName status';
const COMPANY_FIELDS = 'name emails status';
const CLIENT_FIELDS = 'name email company status';

/** A record's addresses. A row stored before the address list existed has only `email`. */
function pointsOf(row: StoredRow): EmailPoint[] {
  if (row.emails?.length) {
    return row.emails.map((point) => ({
      address: point.address,
      label: point.label ?? '',
      primary: point.primary === true,
    }));
  }
  return row.email ? [{ address: row.email, label: 'Work', primary: true }] : [];
}

const toRecord =
  (kind: RecordKind, via: RecordVia) =>
  (row: StoredRow): AudienceRecord => ({
    kind,
    id: String(row._id),
    name: row.name,
    company: kind === 'COMPANY' ? row.name : (row.companyName ?? row.company ?? ''),
    status: row.status,
    via,
    points: pointsOf(row),
  });

/** First mention wins, so a record named by hand keeps SELECTED over a rule's copy of it. */
function uniqueById(records: AudienceRecord[]): AudienceRecord[] {
  const seen = new Map<string, AudienceRecord>();
  for (const record of records) {
    if (!seen.has(record.id)) {
      seen.set(record.id, record);
    }
  }
  return [...seen.values()];
}

const byIds = (ids: readonly string[]) => ({ _id: { $in: [...ids] } });

async function contactsWhere(filter: object, via: RecordVia): Promise<AudienceRecord[]> {
  const rows = await ContactModel.find(filter).select(CONTACT_FIELDS).lean<StoredRow[]>();
  return rows.map(toRecord('CONTACT', via));
}

async function companiesWhere(filter: object, via: RecordVia): Promise<AudienceRecord[]> {
  const rows = await CompanyModel.find(filter).select(COMPANY_FIELDS).lean<StoredRow[]>();
  return rows.map(toRecord('COMPANY', via));
}

async function clientsWhere(filter: object, via: RecordVia): Promise<AudienceRecord[]> {
  const rows = await ClientModel.find(filter).select(CLIENT_FIELDS).lean<StoredRow[]>();
  return rows.map(toRecord('CLIENT', via));
}

/** Contacts by id, as they are now — a snapshot re-reads its people's consent through this. */
export const contactsByIds = (ids: readonly string[]) => contactsWhere(byIds(ids), 'RULES');

const usesContacts = (source: RecipientSource) => source === 'CONTACTS' || source === 'BOTH';
const usesCompanies = (source: RecipientSource) => source === 'COMPANIES' || source === 'BOTH';

/** Whether matching companies bring their people in. */
const expandsCompanies = (source: CompanyEmailSource) => source !== 'COMPANY_EMAILS';

/** Whether matching companies' own mailboxes are written to. */
export const usesCompanyMailboxes = (source: CompanyEmailSource) => source !== 'LINKED_CONTACTS';

/** Every record the rules and the named data sources match today. */
export async function matchRecords(rules: RecordRules): Promise<RecordSet> {
  const { recipientSource } = rules;
  const [namedContacts, namedCompanies, namedClients, activeClients, ruleContacts, ruleCompanies] =
    await Promise.all([
      contactsWhere(byIds(rules.contactIds), 'SELECTED'),
      companiesWhere(byIds(rules.companyIds), 'SELECTED'),
      clientsWhere(byIds(rules.clientIds), 'SELECTED'),
      rules.allActiveClients ? clientsWhere({ status: 'ACTIVE' }, 'SELECTED') : [],
      usesContacts(recipientSource)
        ? rulesFilter('CONTACT', rules).then((filter) => contactsWhere(filter, 'RULES'))
        : [],
      usesCompanies(recipientSource)
        ? rulesFilter('COMPANY', rules).then((filter) => companiesWhere(filter, 'RULES'))
        : [],
    ]);
  const companies = uniqueById([...namedCompanies, ...ruleCompanies]);
  const linked = expandsCompanies(rules.companyEmailSource)
    ? await contactsWhere({ companyId: { $in: companies.map((c) => c.id) } }, 'LINKED_CONTACT')
    : [];
  return {
    contacts: uniqueById([...namedContacts, ...ruleContacts, ...linked]),
    companies,
    clients: uniqueById([...namedClients, ...activeClients]),
  };
}

/** A FIXED_RECORDS audience's frozen records, with their addresses as they are now. */
export async function loadFrozenRecords(audienceId: string): Promise<RecordSet> {
  const rows = await AudienceSnapshotRecordModel.find({ audienceId }).lean();
  const viaOf = new Map(rows.map((row) => [`${row.kind}:${row.recordId}`, row.via as RecordVia]));
  const idsOf = (kind: RecordKind) =>
    rows.filter((row) => row.kind === kind).map((row) => row.recordId);
  const withVia = (records: AudienceRecord[]) =>
    records.map((record) => ({
      ...record,
      via: viaOf.get(`${record.kind}:${record.id}`) ?? record.via,
    }));
  const [contacts, companies, clients] = await Promise.all([
    contactsWhere(byIds(idsOf('CONTACT')), 'RULES'),
    companiesWhere(byIds(idsOf('COMPANY')), 'RULES'),
    clientsWhere(byIds(idsOf('CLIENT')), 'RULES'),
  ]);
  return { contacts: withVia(contacts), companies: withVia(companies), clients: withVia(clients) };
}
