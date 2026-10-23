import { CompanyModel } from '../crm/company.model';
import { ContactModel } from '../crm/contact.model';
import { SHARED_MAIL_DOMAINS } from '../gmail/gmail.sync';

/** The CRM contact or company a conversation is with, matched by address and domain. */
export interface RecordLink {
  object: 'CONTACT' | 'COMPANY';
  id: string;
  name: string;
}

const domainOf = (address: string) => address.slice(address.lastIndexOf('@') + 1);

/** Every contact with one of the addresses, by each address it has. */
async function contactsByAddress(addresses: string[]) {
  const contacts = await ContactModel.find({
    $or: [{ email: { $in: addresses } }, { 'emails.address': { $in: addresses } }],
  })
    .select('name email emails')
    .lean<
      Array<{ _id: unknown; name: string; email: string; emails?: Array<{ address: string }> }>
    >();
  const found = new Map<string, RecordLink>();
  for (const contact of contacts) {
    const link: RecordLink = { object: 'CONTACT', id: String(contact._id), name: contact.name };
    for (const address of [contact.email, ...(contact.emails ?? []).map((e) => e.address)]) {
      found.set(address, link);
    }
  }
  return found;
}

/** Every company with one of the domains (shared mail providers excepted), by domain. */
async function companiesByDomain(domains: string[]) {
  const own = domains.filter((domain) => !SHARED_MAIL_DOMAINS.has(domain));
  if (own.length === 0) {
    return new Map<string, RecordLink>();
  }
  const companies = await CompanyModel.find({ domain: { $in: own } })
    .select('name domain')
    .lean<Array<{ _id: unknown; name: string; domain: string }>>();
  return new Map(
    companies.map((company): [string, RecordLink] => [
      company.domain,
      { object: 'COMPANY', id: String(company._id), name: company.name },
    ]),
  );
}

/**
 * The record each conversation is with: the first other participant who is a CRM contact,
 * else the first whose domain is a CRM company's, else none. Two queries for a whole page.
 * `own` are the connected mailboxes' addresses, which never count as the other side.
 */
export async function recordLinks(
  threads: ReadonlyArray<{ participants: string[] }>,
  own: ReadonlySet<string>,
): Promise<Array<RecordLink | null>> {
  const others = threads.map((thread) => thread.participants.filter((a) => !own.has(a)));
  const addresses = [...new Set(others.flat())];
  if (addresses.length === 0) {
    return threads.map(() => null);
  }
  const [contacts, companies] = await Promise.all([
    contactsByAddress(addresses),
    companiesByDomain([...new Set(addresses.map(domainOf))]),
  ]);
  return others.map((list) => {
    const contact = list.find((address) => contacts.has(address));
    if (contact) {
      return contacts.get(contact) ?? null;
    }
    const company = list.find((address) => companies.has(domainOf(address)));
    return company ? (companies.get(domainOf(company)) ?? null) : null;
  });
}
