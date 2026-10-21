import { badRequest } from '../../../utils/errors';
import { isWebAddress } from '../../../utils/webAddress';
import { COMMUNICATION_TYPES, type CommunicationType } from './client-communication.model';

/** The longest each field may be, in characters — the same caps the portal forms check. */
export const RECORD_LIMITS = {
  title: 200,
  url: 2000,
  description: 500,
  details: 5000,
  subject: 200,
  summary: 2000,
  participants: 500,
  note: 1000,
  message: 10_000,
} as const;

const COMMUNICATION_TYPE_SET: ReadonlySet<string> = new Set(COMMUNICATION_TYPES);

/** Trimmed text no longer than `max`; refused with `message` when too long or, if `required`, empty. */
export function cleanText(
  value: string | null | undefined,
  max: number,
  message: string,
  required: boolean,
): string {
  const text = (value ?? '').trim();
  if ((required && text === '') || text.length > max) {
    badRequest(message);
  }
  return text;
}

export interface ClientLinkInput {
  title: string;
  url: string;
  description?: string | null;
  details?: string | null;
  /** Email the client's hub contacts about the new link. Only read on create. */
  notify?: boolean | null;
}

export function normalizeLink(input: ClientLinkInput) {
  const url = cleanText(input.url, RECORD_LIMITS.url, 'Enter the link’s address.', true);
  if (!isWebAddress(url)) {
    badRequest('Enter a full web address starting with http:// or https://.');
  }
  return {
    title: cleanText(input.title, RECORD_LIMITS.title, 'Give the link a title.', true),
    url,
    description: cleanText(
      input.description,
      RECORD_LIMITS.description,
      'Keep the description under 500 characters.',
      false,
    ),
    details: cleanText(
      input.details,
      RECORD_LIMITS.details,
      'Keep the details under 5000 characters.',
      false,
    ),
  };
}

export interface ClientCommunicationInput {
  type: CommunicationType;
  occurredAt: Date | string;
  subject: string;
  summary?: string | null;
  details?: string | null;
  participants?: string | null;
  /** Email the client's hub contacts about this entry. Sent at most once per entry. */
  notify?: boolean | null;
}

export function normalizeCommunication(input: ClientCommunicationInput) {
  if (!COMMUNICATION_TYPE_SET.has(input.type)) {
    badRequest('Pick what kind of communication it was.');
  }
  const occurredAt = new Date(input.occurredAt);
  if (Number.isNaN(occurredAt.getTime())) {
    badRequest('Pick when it happened.');
  }
  return {
    type: input.type,
    occurredAt,
    subject: cleanText(input.subject, RECORD_LIMITS.subject, 'Say what it was about.', true),
    summary: cleanText(
      input.summary,
      RECORD_LIMITS.summary,
      'Keep the summary under 2000 characters.',
      false,
    ),
    details: cleanText(
      input.details,
      RECORD_LIMITS.details,
      'Keep the details under 5000 characters.',
      false,
    ),
    participants: cleanText(
      input.participants,
      RECORD_LIMITS.participants,
      'Keep the list of people under 500 characters.',
      false,
    ),
  };
}
