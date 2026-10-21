import { escapeHtml } from '../email/email.render';

/** The groups the variable picker shows. */
export type VariableGroup = 'CONTACT' | 'COMPANY' | 'CAMPAIGN' | 'SYSTEM' | 'LINKS';

/** TEXT is escaped where it lands; URL must also be an http(s) address or it renders empty. */
export type VariableKind = 'TEXT' | 'URL';

/** Who one copy is addressed to, read from the CRM record chosen for the address. */
export interface RecipientContext {
  /** Which record supplied the values; SAMPLE is the preview's made-up recipient. */
  kind: 'CONTACT' | 'COMPANY' | 'CLIENT' | 'SAMPLE';
  recordId: string;
  recordName: string;
  email: string;
  fullName: string;
  phone: string;
  designation: string;
  companyName: string;
  companyIndustry: string;
  companyWebsite: string;
  companyCity: string;
}

/** What one copy knows besides its recipient. */
export interface MessageContext {
  campaignName: string;
  senderName: string;
  unsubscribeUrl: string;
  preferencesUrl: string;
  viewInBrowserUrl: string;
  year: number;
}

export interface VariableDefinition {
  key: string;
  group: VariableGroup;
  label: string;
  description: string;
  example: string;
  kind: VariableKind;
  resolve: (recipient: RecipientContext, message: MessageContext) => string;
}

const firstName = (full: string): string => full.trim().split(/\s+/)[0] ?? '';
const lastName = (full: string): string => full.trim().split(/\s+/).slice(1).join(' ');

const def = (
  key: string,
  group: VariableGroup,
  label: string,
  description: string,
  example: string,
  resolve: VariableDefinition['resolve'],
  kind: VariableKind = 'TEXT',
): VariableDefinition => ({ key, group, label, description, example, resolve, kind });

/**
 * Every variable a campaign may use, and the CRM field it comes from. The CRM keeps a person's
 * name in one field, so first and last name are split from it; a company-only recipient has
 * no person, so person fields are empty there and their fallback is used.
 */
export const VARIABLES: readonly VariableDefinition[] = [
  def(
    'contact.firstName',
    'CONTACT',
    'First name',
    'First word of the contact’s name.',
    'Rahul',
    (r) => firstName(r.fullName),
  ),
  def('contact.lastName', 'CONTACT', 'Last name', 'Rest of the contact’s name.', 'Sharma', (r) =>
    lastName(r.fullName),
  ),
  def(
    'contact.fullName',
    'CONTACT',
    'Full name',
    'The contact’s name as saved in the CRM.',
    'Rahul Sharma',
    (r) => r.fullName,
  ),
  def(
    'contact.email',
    'CONTACT',
    'Email',
    'The address this copy is sent to.',
    'rahul@urbancafe.in',
    (r) => r.email,
  ),
  def(
    'contact.phone',
    'CONTACT',
    'Phone',
    'The contact’s primary phone.',
    '+91 98100 00000',
    (r) => r.phone,
  ),
  def(
    'contact.designation',
    'CONTACT',
    'Designation',
    'The contact’s job title.',
    'Owner',
    (r) => r.designation,
  ),
  def(
    'company.name',
    'COMPANY',
    'Company name',
    'The linked or matched company.',
    'Urban Café',
    (r) => r.companyName,
  ),
  def(
    'company.industry',
    'COMPANY',
    'Industry',
    'The company’s industry.',
    'Café',
    (r) => r.companyIndustry,
  ),
  def(
    'company.website',
    'COMPANY',
    'Website',
    'The company’s website.',
    'https://urbancafe.in',
    (r) => r.companyWebsite,
    'URL',
  ),
  def('company.city', 'COMPANY', 'City', 'The company’s city.', 'Delhi', (r) => r.companyCity),
  def(
    'campaign.name',
    'CAMPAIGN',
    'Campaign name',
    'The campaign’s internal name.',
    'October offer',
    (_r, m) => m.campaignName,
  ),
  def(
    'sender.name',
    'CAMPAIGN',
    'Sender name',
    'Who the email is from.',
    'Exyconn',
    (_r, m) => m.senderName,
  ),
  def('current_year', 'SYSTEM', 'Current year', 'The year the email is sent.', '2026', (_r, m) =>
    String(m.year),
  ),
  def(
    'unsubscribe_url',
    'LINKS',
    'Unsubscribe link',
    'The recipient’s own unsubscribe page.',
    'https://…/unsubscribe',
    (_r, m) => m.unsubscribeUrl,
    'URL',
  ),
  def(
    'preferences_url',
    'LINKS',
    'Manage preferences link',
    'The recipient’s email preference page.',
    'https://…/email-preferences',
    (_r, m) => m.preferencesUrl,
    'URL',
  ),
  def(
    'view_in_browser_url',
    'LINKS',
    'View in browser link',
    'This email as a web page.',
    'https://…/m/v/…',
    (_r, m) => m.viewInBrowserUrl,
    'URL',
  ),
];

/** Names campaigns written before the registry used, kept working. */
const ALIASES: Readonly<Record<string, string>> = {
  name: 'contact.fullName',
  email: 'contact.email',
  company: 'company.name',
  unsubscribeUrl: 'unsubscribe_url',
};

const BY_KEY: ReadonlyMap<string, VariableDefinition> = new Map(
  VARIABLES.map((variable) => [variable.key, variable]),
);

const definitionOf = (key: string): VariableDefinition | undefined =>
  BY_KEY.get(ALIASES[key] ?? key);

/** `{{ key }}` or `{{ key | fallback }}`. The fallback is plain text, never a variable. */
const TOKEN = /\{\{\s*([a-zA-Z][\w.]*)\s*(?:\|([^{}]*))?\}\}/g;

const SAFE_URL = /^(https?:\/\/|mailto:)/i;

export interface VariableUse {
  key: string;
  fallback: string | null;
}

/** Every variable a piece of content uses, first appearance of each. */
export function variableUses(source: string): VariableUse[] {
  const seen = new Map<string, VariableUse>();
  for (const match of source.matchAll(TOKEN)) {
    if (!seen.has(match[1])) {
      seen.set(match[1], { key: match[1], fallback: match[2]?.trim() ?? null });
    }
  }
  return [...seen.values()];
}

/** Keys that are not in the registry. */
export const unknownVariables = (source: string): string[] =>
  variableUses(source)
    .map((use) => use.key)
    .filter((key) => !definitionOf(key));

/** Variables used without a fallback that would render empty for this recipient. */
export function missingValues(
  source: string,
  recipient: RecipientContext,
  message: MessageContext,
): string[] {
  return variableUses(source)
    .filter((use) => use.fallback === null)
    .filter((use) => {
      const variable = definitionOf(use.key);
      return variable?.resolve(recipient, message).trim() === '';
    })
    .map((use) => use.key);
}

function valueFor(key: string, recipient: RecipientContext, message: MessageContext): string {
  const variable = definitionOf(key);
  if (!variable) {
    return '';
  }
  const value = variable.resolve(recipient, message).trim();
  return variable.kind === 'URL' && !SAFE_URL.test(value) ? '' : value;
}

/**
 * Substitutes every variable. For HTML each value — and each fallback — is escaped, so a CRM
 * name can never become markup; for a subject or plain text, line breaks are removed so a
 * value can never start a new header. Unknown variables render empty (the checks block them).
 */
export function renderVariables(
  source: string,
  recipient: RecipientContext,
  message: MessageContext,
  output: 'html' | 'text',
): string {
  return source.replaceAll(TOKEN, (_match, key: string, fallback?: string) => {
    const value = valueFor(key, recipient, message) || (fallback ?? '').trim();
    return output === 'html' ? escapeHtml(value) : value.replaceAll(/[\r\n]+/g, ' ');
  });
}

/** The made-up recipient previews use when no CRM record is chosen. */
export const SAMPLE_RECIPIENT: RecipientContext = {
  kind: 'SAMPLE',
  recordId: '',
  recordName: 'Sample recipient',
  email: 'rahul@example.com',
  fullName: 'Rahul Sharma',
  phone: '+91 98100 00000',
  designation: 'Owner',
  companyName: 'Urban Café',
  companyIndustry: 'Café',
  companyWebsite: 'https://example.com',
  companyCity: 'Delhi',
};
