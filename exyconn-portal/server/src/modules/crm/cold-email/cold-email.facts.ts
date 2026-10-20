import { CompanyModel } from '../company.model';
import { ContactModel } from '../contact.model';
import { DealModel } from '../deal.model';
import { ORIGIN_LABEL, type OriginSource } from '../crm.origin';
import { customProperties } from '../records/crm.schema';
import type { CrmObject, PropertyDef, PropertyType } from '../records/crm.objects';

/**
 * What the model reads about a contact or company: "Label: value" lines from the record's
 * profile, notes, custom properties, deals and (for a company) its key people. Email
 * addresses, phone numbers and street addresses stay out — the email does not need them.
 */

/** The most of any one free-text field (about, notes, a long custom value) the model reads. */
export const MAX_FACT_CHARS = 1500;
/** The open and recent deals the model reads, so it knows where things stand commercially. */
const DEAL_ITEMS = 5;
/** The people at a company the model reads, so it can address the right role. */
const KEY_PEOPLE = 5;

/** Custom property types that are contact points or uploads, not facts about the business. */
const PRIVATE_TYPES: ReadonlySet<PropertyType> = new Set(['EMAIL', 'PHONE', 'FILE']);

const COMPANY_SELECT =
  'name domain website industry size status employeeCount annualRevenue foundedYear location city country timezone linkedinUrl twitterUrl description notes origin custom tags';
const CONTACT_SELECT =
  'name title department companyId companyName status website city country timezone linkedinUrl twitterUrl lifecycleStage leadSource languages description notes origin custom tags';

type Fact = string | number | null | undefined;

/** "Label: value", or nothing when the value is unknown; long text is cut to the cap. */
const fact = (label: string, value: Fact) =>
  value === null || value === undefined || value === ''
    ? []
    : [`${label}: ${String(value).trim().slice(0, MAX_FACT_CHARS)}`];

const listOf = (values: string[] | null | undefined) => (values?.length ? values.join(', ') : '');

const placeOf = (...parts: Array<string | null | undefined>) => parts.filter(Boolean).join(', ');

const originOf = (origin: { source?: string | null } | null | undefined) =>
  origin?.source ? ORIGIN_LABEL[origin.source as OriginSource] : '';

/** A custom value as text: choice labels rather than stored values, dates as days. */
function customText(property: PropertyDef, value: unknown): string {
  const labelOf = (raw: unknown) =>
    property.options.find((option) => option.value === raw)?.label ?? String(raw);
  if (Array.isArray(value)) {
    return value.map(labelOf).join(', ');
  }
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  return labelOf(value);
}

/** The company's own properties on the record, by their labels. */
async function customLines(object: CrmObject, custom: unknown): Promise<string[]> {
  if (!custom || typeof custom !== 'object') {
    return [];
  }
  const values = custom as Record<string, unknown>;
  const properties = await customProperties(object);
  return properties
    .filter((property) => !PRIVATE_TYPES.has(property.type))
    .flatMap((property) => {
      const value = values[property.key];
      return value === null || value === undefined
        ? []
        : fact(property.label, customText(property, value));
    });
}

async function dealLines(filter: { contactId: string } | { companyId: string }) {
  const deals = await DealModel.find(filter)
    .sort({ updatedAt: -1 })
    .limit(DEAL_ITEMS)
    .select('title stage')
    .lean();
  return deals.map((deal) => `Deal with us: ${deal.title} (stage ${deal.stage})`);
}

/** Up to five people at the company still there, with their roles. */
async function keyPeopleLines(companyId: string) {
  const people = await ContactModel.find({ companyId, status: { $ne: 'LEFT_COMPANY' } })
    .sort({ updatedAt: -1 })
    .limit(KEY_PEOPLE)
    .select('name title')
    .lean();
  return people.map((person) =>
    person.title ? `Person there: ${person.name}, ${person.title}` : `Person there: ${person.name}`,
  );
}

export async function companyFacts(id: string, withPeople: boolean) {
  const company = await CompanyModel.findById(id).select(COMPANY_SELECT).lean();
  if (!company) {
    return null;
  }
  const [custom, deals, people] = await Promise.all([
    customLines('COMPANY', company.custom),
    withPeople ? dealLines({ companyId: id }) : Promise.resolve([]),
    withPeople ? keyPeopleLines(id) : Promise.resolve([]),
  ]);
  const website = company.website || company.domain;
  const lines = [
    ...fact('Company', company.name),
    ...fact('Industry', company.industry),
    ...fact('Website', website),
    ...fact('Where they stand with us', company.status),
    ...fact('Size', company.size),
    ...fact('Employees', company.employeeCount),
    ...fact('Annual revenue', company.annualRevenue),
    ...fact('Founded', company.foundedYear),
    ...fact('Location', placeOf(company.city, company.country) || company.location),
    ...fact('Time zone', company.timezone),
    ...fact('Company LinkedIn', company.linkedinUrl),
    ...fact('Company X/Twitter', company.twitterUrl),
    ...fact('How they came to us', originOf(company.origin)),
    ...fact('Tags', listOf(company.tags)),
    ...custom,
    ...fact('About the company', company.description),
    ...fact('Our notes on the company', company.notes),
    ...deals,
    ...people,
  ];
  return { name: company.name, website, lines };
}

export async function contactFacts(id: string) {
  const contact = await ContactModel.findById(id).select(CONTACT_SELECT).lean();
  if (!contact) {
    return null;
  }
  const [company, custom, deals] = await Promise.all([
    contact.companyId ? companyFacts(contact.companyId, false) : Promise.resolve(null),
    customLines('CONTACT', contact.custom),
    dealLines({ contactId: id }),
  ]);
  const lines = [
    ...fact('Person', contact.name),
    ...fact('Job title', contact.title),
    ...fact('Department', contact.department),
    ...fact('Works at', contact.companyName),
    ...fact('Lifecycle stage', contact.lifecycleStage),
    ...fact('Contact status', contact.status),
    ...fact('Lead source', contact.leadSource),
    ...fact('How they came to us', originOf(contact.origin)),
    ...fact('Location', placeOf(contact.city, contact.country)),
    ...fact('Time zone', contact.timezone),
    ...fact('Languages', listOf(contact.languages)),
    ...fact('LinkedIn', contact.linkedinUrl),
    ...fact('X/Twitter', contact.twitterUrl),
    ...fact('Tags', listOf(contact.tags)),
    ...custom,
    ...fact('About the person', contact.description),
    ...fact('Our notes on the person', contact.notes),
    ...deals,
    ...(company?.lines ?? []),
  ];
  return { name: contact.name, website: contact.website || company?.website || '', lines };
}
