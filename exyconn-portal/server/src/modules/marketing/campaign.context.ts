import { ClientModel } from '../clients/clients.model';
import { CompanyModel } from '../crm/company.model';
import { ContactModel } from '../crm/contact.model';
import type { RecipientContext } from './campaign.variables';
import type { RecipientSourceRef } from './audience.resolve';

interface ContactRow {
  _id: unknown;
  name: string;
  phone?: string;
  title?: string;
  companyId?: string;
  companyName?: string;
}
interface CompanyRow {
  _id: unknown;
  name: string;
  industry?: string;
  website?: string;
  city?: string;
  location?: string;
}
interface ClientRow {
  _id: unknown;
  name: string;
  company?: string;
  phone?: string;
}

/** Lower ranks win: a person named by hand speaks for an address before a company inbox. */
const RANK: Readonly<Record<string, number>> = {
  'CONTACT:SELECTED': 0,
  'CONTACT:RULES': 1,
  'CONTACT:LINKED_CONTACT': 2,
  'CLIENT:SELECTED': 3,
  'COMPANY:SELECTED': 4,
  'COMPANY:RULES': 5,
};

const rankOf = (source: RecipientSourceRef) => RANK[`${source.kind}:${source.via}`] ?? 9;

/**
 * The record whose details fill an address's variables. Deterministic — rank, then id — so a
 * preview and the real send always pick the same record for the same address.
 */
export function chooseSource(sources: readonly RecipientSourceRef[]): RecipientSourceRef | null {
  const ordered = [...sources].sort((a, b) => rankOf(a) - rankOf(b) || a.id.localeCompare(b.id));
  return ordered[0] ?? null;
}

const emptyContext = (email: string): RecipientContext => ({
  kind: 'CONTACT',
  recordId: '',
  recordName: '',
  email,
  fullName: '',
  phone: '',
  designation: '',
  companyName: '',
  companyIndustry: '',
  companyWebsite: '',
  companyCity: '',
});

const companyFields = (company: CompanyRow | undefined, fallbackName = '') => ({
  companyName: company?.name ?? fallbackName,
  companyIndustry: company?.industry ?? '',
  companyWebsite: company?.website ?? '',
  companyCity: company?.city || company?.location || '',
});

const byId = <T extends { _id: unknown }>(rows: T[]) =>
  new Map(rows.map((row) => [String(row._id), row]));

/** Loads every record the chosen sources name, in three queries for the whole batch. */
async function loadRecords(chosen: readonly RecipientSourceRef[]) {
  const idsOf = (kind: string) => chosen.filter((s) => s.kind === kind).map((s) => s.id);
  const [contacts, clients] = await Promise.all([
    ContactModel.find({ _id: { $in: idsOf('CONTACT') } })
      .select('name phone title companyId companyName')
      .lean<ContactRow[]>(),
    ClientModel.find({ _id: { $in: idsOf('CLIENT') } })
      .select('name company phone')
      .lean<ClientRow[]>(),
  ]);
  const companyIds = [
    ...idsOf('COMPANY'),
    ...contacts.map((c) => c.companyId ?? '').filter(Boolean),
  ];
  const companies = await CompanyModel.find({ _id: { $in: companyIds } })
    .select('name industry website city location')
    .lean<CompanyRow[]>();
  return { contacts: byId(contacts), clients: byId(clients), companies: byId(companies) };
}

type Loaded = Awaited<ReturnType<typeof loadRecords>>;

function contextOf(
  email: string,
  source: RecipientSourceRef | null,
  loaded: Loaded,
): RecipientContext {
  if (!source) {
    return emptyContext(email);
  }
  const base = {
    ...emptyContext(email),
    kind: source.kind,
    recordId: source.id,
    recordName: source.name,
  };
  if (source.kind === 'CONTACT') {
    const contact = loaded.contacts.get(source.id);
    return {
      ...base,
      fullName: contact?.name ?? '',
      phone: contact?.phone ?? '',
      designation: contact?.title ?? '',
      ...companyFields(loaded.companies.get(contact?.companyId ?? ''), contact?.companyName ?? ''),
    };
  }
  if (source.kind === 'CLIENT') {
    const client = loaded.clients.get(source.id);
    return {
      ...base,
      fullName: client?.name ?? '',
      phone: client?.phone ?? '',
      companyName: client?.company ?? '',
    };
  }
  return { ...base, ...companyFields(loaded.companies.get(source.id)) };
}

/** Each address's recipient context, for a batch of resolved recipients. */
export async function contextsFor(
  recipients: readonly { email: string; sources: RecipientSourceRef[] }[],
): Promise<Map<string, RecipientContext>> {
  const chosen = recipients.map((recipient) => chooseSource(recipient.sources));
  const loaded = await loadRecords(
    chosen.filter((source): source is RecipientSourceRef => source !== null),
  );
  return new Map(
    recipients.map((recipient, index) => [
      recipient.email,
      contextOf(recipient.email, chosen[index], loaded),
    ]),
  );
}

/** One record as a preview recipient: a contact, or a company with no person. */
export async function contextForRecord(
  kind: 'CONTACT' | 'COMPANY',
  id: string,
): Promise<RecipientContext | null> {
  const source: RecipientSourceRef = { kind, id, name: '', via: 'SELECTED' };
  const loaded = await loadRecords([source]);
  const contact = loaded.contacts.get(id);
  const company = loaded.companies.get(id);
  if (!contact && !company) {
    return null;
  }
  const email = await addressOf(kind, id);
  return { ...contextOf(email, source, loaded), recordName: contact?.name ?? company?.name ?? '' };
}

/** A record's primary address, for the preview's "To" line. */
async function addressOf(kind: 'CONTACT' | 'COMPANY', id: string): Promise<string> {
  const model = kind === 'CONTACT' ? ContactModel : CompanyModel;
  const row = await (model as typeof ContactModel)
    .findById(id)
    .select('email emails')
    .lean<{ email?: string; emails?: { address: string; primary?: boolean }[] }>();
  return (
    row?.email ||
    row?.emails?.find((point) => point.primary)?.address ||
    row?.emails?.[0]?.address ||
    ''
  );
}
