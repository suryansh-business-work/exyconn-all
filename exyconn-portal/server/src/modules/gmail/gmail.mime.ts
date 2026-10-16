import { htmlToText } from '../../utils/inboundMail';

/** Building and reading the RFC 5322 messages Gmail's API speaks. */

export interface OutgoingEmail {
  from: string;
  to: string[];
  cc: string[];
  subject: string;
  body: string;
  /** The Message-ID being answered, so mail clients thread the reply. */
  inReplyTo?: string;
  /** Every Message-ID of the conversation so far, oldest first (RFC 5322 References). */
  references?: string[];
}

/** In-Reply-To and References for a reply; none for a new email. */
function threadingHeaders(email: OutgoingEmail): string[] {
  if (!email.inReplyTo) {
    return [];
  }
  const chain = [
    ...(email.references ?? []).filter((id) => id !== email.inReplyTo),
    email.inReplyTo,
  ];
  return [
    `In-Reply-To: ${oneLine(email.inReplyTo)}`,
    `References: ${chain.map(oneLine).join(' ')}`,
  ];
}

/** A header value with no line breaks, so nothing typed can add a header of its own. */
const oneLine = (value: string) => value.replaceAll(/[\r\n]+/g, ' ').trim();

/** RFC 2047 for a subject outside ASCII, so it survives every mail server. */
const encodedWord = (value: string) =>
  `=?UTF-8?B?${Buffer.from(value, 'utf8').toString('base64')}?=`;

/** The whole message, base64url-encoded the way users.messages.send wants it. */
export function rawMessage(email: OutgoingEmail): string {
  const headers = [
    `From: ${oneLine(email.from)}`,
    `To: ${email.to.map(oneLine).join(', ')}`,
    ...(email.cc.length > 0 ? [`Cc: ${email.cc.map(oneLine).join(', ')}`] : []),
    `Subject: ${encodedWord(oneLine(email.subject))}`,
    ...threadingHeaders(email),
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
  ];
  const body = Buffer.from(email.body, 'utf8').toString('base64');
  return Buffer.from(`${headers.join('\r\n')}\r\n\r\n${body}`, 'utf8').toString('base64url');
}

export interface GmailPart {
  mimeType?: string;
  body?: { data?: string };
  parts?: GmailPart[];
  headers?: Array<{ name: string; value: string }>;
}

/** The decoded body of the first part of one MIME type; '' when the message has none. */
function firstPartOf(part: GmailPart | undefined, mimeType: string): string {
  if (!part) {
    return '';
  }
  if (part.mimeType === mimeType && part.body?.data) {
    return Buffer.from(part.body.data, 'base64url').toString('utf8');
  }
  for (const child of part.parts ?? []) {
    const text = firstPartOf(child, mimeType);
    if (text) {
      return text;
    }
  }
  return '';
}

/**
 * What a message says, as text only: its plain part, or its HTML part with every tag and
 * script stripped, so nothing a sender wrote can run in the CRM.
 */
export const bodyTextOf = (part: GmailPart | undefined): string =>
  firstPartOf(part, 'text/plain') || htmlToText(firstPartOf(part, 'text/html'));

export const headerOf = (part: GmailPart | undefined, name: string): string =>
  part?.headers?.find((header) => header.name.toLowerCase() === name.toLowerCase())?.value ?? '';

/** "Asha <asha@acme.io>, b@x.com" → ["asha@acme.io", "b@x.com"]. */
export function addressesIn(header: string): string[] {
  return header
    .split(',')
    .map((part) => {
      const open = part.indexOf('<');
      const close = part.indexOf('>', open);
      const address = open >= 0 && close > open ? part.slice(open + 1, close) : part;
      return address.trim().toLowerCase();
    })
    .filter((address) => address.includes('@'));
}
