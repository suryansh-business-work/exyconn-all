/** One field of a submission as the inbox shows it. */
export interface SubmissionEntry {
  key: string;
  label: string;
  value: string;
  /** How the value opens: an email address or a phone number becomes a link. */
  link?: string;
}

/** Keys that name the sender, in the order the forms use them. */
const NAME_KEYS = ['name', 'fullName'] as const;
/** Keys worth a line in the list: what the enquiry is about, most specific first. */
const SUMMARY_KEYS = ['subject', 'message', 'details', 'description', 'grievance', 'position'];
const SUMMARY_LENGTH = 80;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_KEYS = new Set(['phone', 'mobile', 'phoneNumber', 'whatsapp']);

type Payload = Record<string, unknown>;

const asRecord = (data: unknown): Payload =>
  typeof data === 'object' && data !== null && !Array.isArray(data) ? (data as Payload) : {};

const text = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  return typeof value === 'object' ? JSON.stringify(value) : String(value).trim();
};

/** `firstName` → `First name`, `india-offer` → `India offer`. */
export function humanize(key: string): string {
  const words = key
    .replaceAll(/[-_]+/g, ' ')
    .replaceAll(/([a-z\d])([A-Z])/g, '$1 $2')
    .trim()
    .toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Who sent it: their name and email, whichever the form asked for. */
export function senderOf(data: unknown): string {
  const record = asRecord(data);
  const joined = [text(record.firstName), text(record.lastName)].filter(Boolean).join(' ');
  const name = joined || NAME_KEYS.map((key) => text(record[key])).find(Boolean) || '';
  const email = text(record.email);
  if (name && email) return `${name} <${email}>`;
  return name || email || '—';
}

/** What it is about, in one short line. */
export function summaryOf(data: unknown): string {
  const record = asRecord(data);
  const line = SUMMARY_KEYS.map((key) => text(record[key])).find(Boolean) ?? '';
  if (line.length <= SUMMARY_LENGTH) return line || '—';
  return `${line.slice(0, SUMMARY_LENGTH - 1)}…`;
}

function linkOf(key: string, value: string): string | undefined {
  if (EMAIL.test(value)) return `mailto:${value}`;
  if (PHONE_KEYS.has(key)) return `tel:${value.replaceAll(/[^\d+]/g, '')}`;
  return undefined;
}

/** Every filled-in field, labelled, in the order the visitor filled them in. */
export function entriesOf(data: unknown): SubmissionEntry[] {
  return Object.entries(asRecord(data))
    .map(([key, raw]) => ({ key, value: text(raw) }))
    .filter((entry) => entry.value !== '')
    .map(({ key, value }) => ({ key, label: humanize(key), value, link: linkOf(key, value) }));
}
