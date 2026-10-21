import { CompanyModel } from '../crm/company.model';
import { ContactModel } from '../crm/contact.model';
import { escapeRegex } from '../../utils/tableQuery';
import { normalizeEmail } from './audience.eligibility';

/** How many CRM records a name search may widen a suppression search to. */
const MAX_NAME_MATCHES = 500;

/** A CRM record that holds a suppressed address, and every address it has. */
export interface SuppressionLink {
  kind: 'CONTACT' | 'COMPANY';
  id: string;
  name: string;
  /** All of the record's addresses, the suppressed one included. Never suppressed for it. */
  emails: string[];
}

interface CrmRow {
  _id: unknown;
  name: string;
  email?: string | null;
  emails?: { address: string }[] | null;
}

const addressesOf = (row: CrmRow): string[] => {
  const listed = (row.emails ?? []).map((point) => normalizeEmail(point.address));
  const single = row.email ? [normalizeEmail(row.email)] : [];
  return [...new Set([...listed, ...single])];
};

const byAddress = (emails: readonly string[]) => ({
  $or: [{ 'emails.address': { $in: emails } }, { email: { $in: emails } }],
});

/** Adds to `links` the contacts and companies behind each wanted address, in two indexed queries. */
async function addCrmLinks(
  links: Map<string, SuppressionLink[]>,
  wanted: readonly string[],
): Promise<void> {
  const [contacts, companies] = await Promise.all([
    ContactModel.find(byAddress(wanted)).select('name email emails').lean<CrmRow[]>(),
    CompanyModel.find({ 'emails.address': { $in: wanted } })
      .select('name emails')
      .lean<CrmRow[]>(),
  ]);
  const add = (kind: SuppressionLink['kind']) => (row: CrmRow) => {
    const all = addressesOf(row);
    for (const email of all) {
      links.get(email)?.push({ kind, id: String(row._id), name: row.name, emails: all });
    }
  };
  contacts.forEach(add('CONTACT'));
  companies.forEach(add('COMPANY'));
}

/**
 * The contacts and companies behind each address, in two indexed queries for the whole page.
 * A suppression is the address's alone; the links are read live so they follow CRM edits.
 */
export async function crmLinksFor(
  emails: readonly string[],
): Promise<Map<string, SuppressionLink[]>> {
  const wanted = [...new Set(emails.map(normalizeEmail))];
  const links = new Map<string, SuppressionLink[]>(wanted.map((email) => [email, []]));
  if (wanted.length > 0) {
    await addCrmLinks(links, wanted);
  }
  return links;
}

/** Every address of the contacts and companies whose name matches, for searching the list. */
export async function addressesOfCrmNamed(search: string): Promise<string[]> {
  const name = new RegExp(escapeRegex(search), 'i');
  const [contacts, companies] = await Promise.all([
    ContactModel.find({ name }).select('email emails').limit(MAX_NAME_MATCHES).lean<CrmRow[]>(),
    CompanyModel.find({ name }).select('emails').limit(MAX_NAME_MATCHES).lean<CrmRow[]>(),
  ]);
  return [...new Set([...contacts, ...companies].flatMap(addressesOf))];
}
